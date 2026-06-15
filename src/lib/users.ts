// D1-backed user store. This is the ONLY file that knows SQL — everything else
// works with the camelCase `User` type below.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { hashPassword, type Role } from "@/lib/auth";

export type User = {
  id: string;
  username: string;
  name: string;
  themeId: string | null;
  role: Role;
  passwordHash: string;
};

// `User` without the secret — what the admin API returns to the browser.
export type PublicUser = Omit<User, "passwordHash">;

type UserRow = {
  id: string;
  username: string;
  name: string;
  theme_id: string | null;
  role: string;
  password_hash: string;
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
    role: row.role === "admin" ? "admin" : "user",
    passwordHash: row.password_hash,
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
  role: Role;
  password: string;
};

export async function createUser(input: CreateUserInput): Promise<User> {
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);
  await db()
    .prepare(
      "INSERT INTO users (id, username, name, theme_id, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(id, input.username, input.name, input.themeId, input.role, passwordHash, Date.now())
    .run();
  return {
    id,
    username: input.username,
    name: input.name,
    themeId: input.themeId,
    role: input.role,
    passwordHash,
  };
}

export type UpdateUserInput = {
  name?: string;
  themeId?: string | null;
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
    role: "admin",
    password,
  });
}
