"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Pencil, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "admin" | "user";

type PublicUser = {
  id: string;
  username: string;
  name: string;
  themeId: string | null;
  groupId: string | null;
  role: Role;
};

type Group = {
  id: string;
  name: string;
  themeId: string | null;
  createdAt: number;
};

type Generation = {
  id: string;
  userId: string | null;
  username: string;
  userName: string;
  kind: "file" | "prompt";
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  promptExcerpt: string | null;
  themeId: string | null;
  status: "ok" | "error";
  error: string | null;
  createdAt: number;
};

const inputClass =
  "flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400";

// Effective theme = per-user override if set, else the user's group theme, else none.
// Mirrors resolveThemeId() on the server so the admin sees what generation will use.
function effectiveTheme(
  user: PublicUser,
  groups: Group[]
): { value: string | null; source: "override" | "group" | "none" } {
  if (user.themeId) return { value: user.themeId, source: "override" };
  if (user.groupId) {
    const group = groups.find((g) => g.id === user.groupId);
    if (group?.themeId) return { value: group.themeId, source: "group" };
  }
  return { value: null, source: "none" };
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWhen(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [history, setHistory] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [usersRes, groupsRes, historyRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/groups"),
        fetch("/api/admin/history"),
      ]);
      setError(null);
      if (!usersRes.ok) {
        const data = (await usersRes.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to load users.");
        return;
      }
      if (!groupsRes.ok) {
        const data = (await groupsRes.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to load groups.");
        return;
      }
      if (!historyRes.ok) {
        const data = (await historyRes.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to load history.");
        return;
      }
      const usersData = (await usersRes.json()) as { users: PublicUser[] };
      const groupsData = (await groupsRes.json()) as { groups: Group[] };
      const historyData = (await historyRes.json()) as { generations: Generation[] };
      setUsers(usersData.users);
      setGroups(groupsData.groups);
      setHistory(historyData.generations);
    } catch {
      setError("Network error while loading data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount: every setState inside load() runs after the await (a later
    // microtask), not synchronously, so it doesn't cause the cascading renders
    // this rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/generate"
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to generator</span>
          </Link>
          <span className="text-xs text-slate-500">Admin · Users · History</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage users</h1>
          <p className="text-slate-500 text-sm">
            Group users by client to share a Gamma theme or set a per-user override. Each
            presentation uses the override if set, otherwise the user&apos;s group theme.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-700">
              Groups {groups.length > 0 && <span className="text-slate-400">({groups.length})</span>}
            </h2>
            <p className="text-xs text-slate-500">
              A group holds one shared theme. Assign users to a group and they inherit it;
              change the theme once to update every member.
            </p>
          </div>
          <CreateGroup onCreated={load} />
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-slate-400">No groups yet.</p>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <GroupRow key={g.id} group={g} onChanged={load} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Users {users.length > 0 && <span className="text-slate-400">({users.length})</span>}
          </h2>
          <CreateUser groups={groups} onCreated={load} />
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-400">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <UserRow key={u.id} user={u} groups={groups} onChanged={load} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-700">
              Upload history {history.length > 0 && <span className="text-slate-400">({history.length})</span>}
            </h2>
            <p className="text-xs text-slate-500">
              Every generation attempt, newest first. Shows who uploaded what and whether it
              succeeded. The 200 most recent are shown.
            </p>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400">No uploads yet.</p>
          ) : (
            <HistoryTable history={history} />
          )}
        </section>
      </main>
    </div>
  );
}

function HistoryTable({ history }: { history: Generation[] }) {
  return (
    <Card className="border-slate-200 shadow-sm py-0">
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">When</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">User</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Type</th>
              <th className="px-4 py-2.5 font-medium">Upload</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((g) => (
              <tr key={g.id} className="border-b border-slate-100 last:border-0 align-top">
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                  {formatWhen(g.createdAt)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="text-slate-900">{g.userName}</span>
                  <span className="text-slate-400"> @{g.username}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                  {g.kind === "file" ? "File" : "Prompt"}
                </td>
                <td className="px-4 py-2.5 text-slate-700 max-w-xs">
                  {g.kind === "file" ? (
                    <div className="min-w-0">
                      <span className="block truncate" title={g.fileName ?? ""}>
                        {g.fileName ?? "(unnamed file)"}
                      </span>
                      {g.fileSize != null && (
                        <span className="text-xs text-slate-400">{formatBytes(g.fileSize)}</span>
                      )}
                    </div>
                  ) : (
                    <span className="block truncate text-slate-500" title={g.promptExcerpt ?? ""}>
                      {g.promptExcerpt ? `"${g.promptExcerpt}"` : "(empty prompt)"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {g.status === "ok" ? (
                    <span className="text-[10px] uppercase tracking-wide bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">
                      ok
                    </span>
                  ) : (
                    <span
                      className="text-[10px] uppercase tracking-wide bg-red-100 text-red-700 rounded px-1.5 py-0.5"
                      title={g.error ?? ""}
                    >
                      error
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function CreateGroup({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [themeId, setThemeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setThemeId("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, themeId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to create group.");
        return;
      }
      reset();
      setOpen(false);
      onCreated();
    } catch {
      setError("Network error while creating group.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-4 w-4" />
        Add group
      </Button>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cg-name">Group name</Label>
              <Input id="cg-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cg-theme">Gamma theme ID</Label>
              <Input
                id="cg-theme"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create group"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function GroupRow({ group, onChanged }: { group: Group; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [themeId, setThemeId] = useState(group.themeId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, themeId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to save.");
        return;
      }
      setEditing(false);
      onChanged();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !confirm(
        `Delete group "${group.name}"? Members will be unassigned (their per-user theme, if any, still applies).`
      )
    )
      return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/groups/${group.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to delete.");
        return;
      }
      onChanged();
    } catch {
      setError("Network error while deleting.");
    }
  }

  if (!editing) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="font-medium text-slate-900 truncate">{group.name}</span>
            <div className="text-xs text-slate-500 mt-0.5">
              Theme:{" "}
              {group.themeId ? (
                <code className="text-slate-700">{group.themeId}</code>
              ) : (
                <span className="text-slate-400">none</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit group">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete group">
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 shadow-sm">
      <CardContent className="pt-5">
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Editing {group.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setEditing(false)}
              aria-label="Cancel edit"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`eg-name-${group.id}`}>Group name</Label>
              <Input
                id={`eg-name-${group.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`eg-theme-${group.id}`}>Gamma theme ID</Label>
              <Input
                id={`eg-theme-${group.id}`}
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                placeholder="none"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function GroupSelect({
  id,
  groups,
  value,
  onChange,
}: {
  id: string;
  groups: Group[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">No group</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}

function CreateUser({ groups, onCreated }: { groups: Group[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [themeId, setThemeId] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setUsername("");
    setName("");
    setGroupId("");
    setThemeId("");
    setRole("user");
    setPassword("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, groupId, themeId, role, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to create user.");
        return;
      }
      reset();
      setOpen(false);
      onCreated();
    } catch {
      setError("Network error while creating user.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-4 w-4" />
        Add user
      </Button>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-username">Username</Label>
              <Input id="c-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Display name</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-group">Group</Label>
              <GroupSelect id="c-group" groups={groups} value={groupId} onChange={setGroupId} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-theme">Theme override</Label>
              <Input
                id="c-theme"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                placeholder="optional, overrides group theme"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-role">Role</Label>
              <select id="c-role" className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-password">Password</Label>
              <Input
                id="c-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="at least 8 characters"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create user"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function UserRow({
  user,
  groups,
  onChanged,
}: {
  user: PublicUser;
  groups: Group[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [groupId, setGroupId] = useState(user.groupId ?? "");
  const [themeId, setThemeId] = useState(user.themeId ?? "");
  const [role, setRole] = useState<Role>(user.role);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const group = user.groupId ? groups.find((g) => g.id === user.groupId) : undefined;
  const effective = effectiveTheme(user, groups);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, groupId, themeId, role, ...(password ? { password } : {}) }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to save.");
        return;
      }
      setPassword("");
      setEditing(false);
      onChanged();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to delete.");
        return;
      }
      onChanged();
    } catch {
      setError("Network error while deleting.");
    }
  }

  if (!editing) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 truncate">{user.name}</span>
              <span className="text-xs text-slate-400">@{user.username}</span>
              {user.role === "admin" && (
                <span className="text-[10px] uppercase tracking-wide bg-indigo-100 text-indigo-700 rounded px-1.5 py-0.5">
                  admin
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 space-x-3">
              <span>
                Group:{" "}
                {group ? (
                  <span className="text-slate-700">{group.name}</span>
                ) : (
                  <span className="text-slate-400">none</span>
                )}
              </span>
              <span>
                Override:{" "}
                {user.themeId ? (
                  <code className="text-slate-700">{user.themeId}</code>
                ) : (
                  <span className="text-slate-400">none</span>
                )}
              </span>
              <span>
                Effective:{" "}
                {effective.value ? (
                  <>
                    <code className="text-slate-700">{effective.value}</code>
                    <span className="text-slate-400"> ({effective.source})</span>
                  </>
                ) : (
                  <span className="text-slate-400">none</span>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit user">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete user">
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 shadow-sm">
      <CardContent className="pt-5">
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Editing @{user.username}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setEditing(false)}
              aria-label="Cancel edit"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`e-name-${user.id}`}>Display name</Label>
              <Input id={`e-name-${user.id}`} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`e-group-${user.id}`}>Group</Label>
              <GroupSelect id={`e-group-${user.id}`} groups={groups} value={groupId} onChange={setGroupId} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`e-theme-${user.id}`}>Theme override</Label>
              <Input
                id={`e-theme-${user.id}`}
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                placeholder="optional, overrides group theme"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`e-role-${user.id}`}>Role</Label>
              <select
                id={`e-role-${user.id}`}
                className={inputClass}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`e-pw-${user.id}`}>Reset password</Label>
              <Input
                id={`e-pw-${user.id}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="leave blank to keep"
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
