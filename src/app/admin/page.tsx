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
  role: Role;
};

const inputClass =
  "flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400";

export default function AdminPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      setError(null);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to load users.");
        return;
      }
      const data = (await res.json()) as { users: PublicUser[] };
      setUsers(data.users);
    } catch {
      setError("Network error while loading users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
          <span className="text-xs text-slate-500">Admin · Users</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage users</h1>
          <p className="text-slate-500 text-sm">
            Create accounts and assign each user a Gamma theme ID. Their presentations use that theme.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <CreateUser onCreated={load} />

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Users {users.length > 0 && <span className="text-slate-400">({users.length})</span>}
          </h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-400">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <UserRow key={u.id} user={u} onChanged={load} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CreateUser({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [themeId, setThemeId] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setUsername("");
    setName("");
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
        body: JSON.stringify({ username, name, themeId, role, password }),
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
              <Label htmlFor="c-theme">Gamma theme ID</Label>
              <Input id="c-theme" value={themeId} onChange={(e) => setThemeId(e.target.value)} placeholder="optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-role">Role</Label>
              <select id="c-role" className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
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

function UserRow({ user, onChanged }: { user: PublicUser; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [themeId, setThemeId] = useState(user.themeId ?? "");
  const [role, setRole] = useState<Role>(user.role);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, themeId, role, ...(password ? { password } : {}) }),
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
            <div className="text-xs text-slate-500 mt-0.5">
              Theme: {user.themeId ? <code className="text-slate-700">{user.themeId}</code> : <span className="text-slate-400">none</span>}
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
              <Label htmlFor={`e-theme-${user.id}`}>Gamma theme ID</Label>
              <Input id={`e-theme-${user.id}`} value={themeId} onChange={(e) => setThemeId(e.target.value)} placeholder="none" />
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
            <div className="space-y-1.5">
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
