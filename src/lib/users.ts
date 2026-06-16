// D1-backed user store. This is the ONLY file that knows SQL — everything else
// works with the camelCase `User` type below.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { hashPassword, type Role } from "@/lib/auth";

export type { Role };

export type User = {
  id: string;
  username: string;
  name: string;
  themeId: string | null; // optional per-user override; null → fall back to group theme
  groupId: string | null;
  role: Role;
  passwordHash: string;
};

// `User` without the secret — what the admin API returns to the browser.
export type PublicUser = Omit<User, "passwordHash">;

export type Group = {
  id: string;
  name: string;
  themeId: string | null;
  createdAt: number;
};

type UserRow = {
  id: string;
  username: string;
  name: string;
  theme_id: string | null;
  group_id: string | null;
  role: string;
  password_hash: string;
  created_at: number;
};

type GroupRow = {
  id: string;
  name: string;
  theme_id: string | null;
  created_at: number;
};

function db() {
  return getCloudflareContext().env.DB;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    themeId: row.theme_id,
    groupId: row.group_id,
    role: row.role === "admin" ? "admin" : "user",
    passwordHash: row.password_hash,
  };
}

function rowToGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    themeId: row.theme_id,
    createdAt: row.created_at,
  };
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  void _passwordHash;
  return rest;
}

export async function findById(id: string): Promise<User | null> {
  const row = await db()
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<UserRow>();
  return row ? rowToUser(row) : null;
}

export async function findByUsername(username: string): Promise<User | null> {
  const row = await db()
    .prepare("SELECT * FROM users WHERE username = ?")
    .bind(username)
    .first<UserRow>();
  return row ? rowToUser(row) : null;
}

export async function listUsers(): Promise<User[]> {
  const { results } = await db()
    .prepare("SELECT * FROM users ORDER BY created_at ASC")
    .all<UserRow>();
  return (results ?? []).map(rowToUser);
}

export type CreateUserInput = {
  username: string;
  name: string;
  themeId: string | null;
  groupId: string | null;
  role: Role;
  password: string;
};

export async function createUser(input: CreateUserInput): Promise<User> {
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);
  await db()
    .prepare(
      "INSERT INTO users (id, username, name, theme_id, group_id, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      id,
      input.username,
      input.name,
      input.themeId,
      input.groupId,
      input.role,
      passwordHash,
      Date.now()
    )
    .run();
  return {
    id,
    username: input.username,
    name: input.name,
    themeId: input.themeId,
    groupId: input.groupId,
    role: input.role,
    passwordHash,
  };
}

export type UpdateUserInput = {
  name?: string;
  themeId?: string | null;
  groupId?: string | null;
  role?: Role;
  password?: string; // when present, resets the password
};

export async function updateUser(id: string, patch: UpdateUserInput): Promise<void> {
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (patch.name !== undefined) {
    sets.push("name = ?");
    values.push(patch.name);
  }
  if (patch.themeId !== undefined) {
    sets.push("theme_id = ?");
    values.push(patch.themeId);
  }
  if (patch.groupId !== undefined) {
    sets.push("group_id = ?");
    values.push(patch.groupId);
  }
  if (patch.role !== undefined) {
    sets.push("role = ?");
    values.push(patch.role);
  }
  if (patch.password !== undefined) {
    sets.push("password_hash = ?");
    values.push(await hashPassword(patch.password));
  }
  if (sets.length === 0) return;

  values.push(id);
  await db()
    .prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteUser(id: string): Promise<void> {
  await db().prepare("DELETE FROM users WHERE id = ?").bind(id).run();
}

// ── Groups ──────────────────────────────────────────────────────────────────
// A group carries a shared theme its members inherit. A user's own themeId, when
// set, overrides the group theme (see resolveThemeId).

export async function listGroups(): Promise<Group[]> {
  const { results } = await db()
    .prepare("SELECT * FROM groups ORDER BY name ASC")
    .all<GroupRow>();
  return (results ?? []).map(rowToGroup);
}

export async function findGroupById(id: string): Promise<Group | null> {
  const row = await db()
    .prepare("SELECT * FROM groups WHERE id = ?")
    .bind(id)
    .first<GroupRow>();
  return row ? rowToGroup(row) : null;
}

export async function findGroupByName(name: string): Promise<Group | null> {
  const row = await db()
    .prepare("SELECT * FROM groups WHERE name = ?")
    .bind(name)
    .first<GroupRow>();
  return row ? rowToGroup(row) : null;
}

export type CreateGroupInput = {
  name: string;
  themeId: string | null;
};

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  await db()
    .prepare("INSERT INTO groups (id, name, theme_id, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, input.name, input.themeId, createdAt)
    .run();
  return { id, name: input.name, themeId: input.themeId, createdAt };
}

export type UpdateGroupInput = {
  name?: string;
  themeId?: string | null;
};

export async function updateGroup(id: string, patch: UpdateGroupInput): Promise<void> {
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (patch.name !== undefined) {
    sets.push("name = ?");
    values.push(patch.name);
  }
  if (patch.themeId !== undefined) {
    sets.push("theme_id = ?");
    values.push(patch.themeId);
  }
  if (sets.length === 0) return;

  values.push(id);
  await db()
    .prepare(`UPDATE groups SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

// Null out membership for any users in this group first (D1 doesn't enforce FKs),
// then drop the group, so no user is left pointing at a deleted group_id.
export async function deleteGroup(id: string): Promise<void> {
  await db().prepare("UPDATE users SET group_id = NULL WHERE group_id = ?").bind(id).run();
  await db().prepare("DELETE FROM groups WHERE id = ?").bind(id).run();
}

// Effective Gamma theme for a user: their own override if set, otherwise their
// group's theme. Used at generation time. One extra query only when no override.
export async function resolveThemeId(user: User): Promise<string | null> {
  if (user.themeId) return user.themeId;
  if (!user.groupId) return null;
  const group = await findGroupById(user.groupId);
  return group?.themeId ?? null;
}

// Bootstrap: if there is no admin yet, create one from ADMIN_USERNAME /
// ADMIN_PASSWORD so the first administrator can log in. Idempotent.
export async function ensureSeeded(): Promise<void> {
  const existing = await db()
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")
    .first<{ n: number }>();
  if (existing && existing.n > 0) return;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return; // misconfigured; login will report it

  // Guard against a racing seed / a pre-existing same-username row.
  const clash = await findByUsername(username);
  if (clash) return;

  await createUser({
    username,
    name: "Administrator",
    themeId: null,
    groupId: null,
    role: "admin",
    password,
  });
}
