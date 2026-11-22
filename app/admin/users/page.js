"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Phone,
  Mail,
  User,
  X,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_TABS = [
  { label: "All Roles", value: "" },
  { label: "Students", value: "student" },
  { label: "Staff", value: "staff" },
  { label: "Admins", value: "admin" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load users");
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setActionSuccess(data.message || "User account removed.");
      setDeleteTarget(null);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setTimeout(() => setActionSuccess(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-semibold mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Identity &amp; Role Governance</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              User Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and manage student accounts, healthcare clinicians, and system administrative privileges.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="gap-1.5 text-xs text-slate-600 hover:text-teal-700 hover:border-teal-300 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh List</span>
          </Button>
        </div>

        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchUsers} className="font-bold underline text-rose-700 ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  roleFilter === tab.value
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Phone Contact</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                        <span>Loading directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No users found</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your search criteria or role filter.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isStaff = u.role === "staff";
                    const isAdmin = u.role === "admin";

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                                isAdmin
                                  ? "bg-indigo-100 text-indigo-700"
                                  : isStaff
                                  ? "bg-sky-100 text-sky-700"
                                  : "bg-teal-100 text-teal-700"
                              }`}
                            >
                              {isAdmin ? (
                                <ShieldCheck className="w-4 h-4" />
                              ) : isStaff ? (
                                <Stethoscope className="w-4 h-4" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-900 truncate">{u.name}</p>
                                {u.regNo && (
                                  <span className="font-mono text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800">
                                    {u.regNo}
                                  </span>
                                )}
                                {u.staffId && (
                                  <span className="font-mono text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-1.5 py-0.2 rounded border border-sky-200 dark:border-sky-800">
                                    {u.staffId}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {u.email}
                              </p>
                              {(u.department || u.medicalDepartment) && (
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {u.department ? `Dept: ${u.department}${u.year ? ` (Yr ${u.year})` : ""}` : u.medicalDepartment}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${
                              isAdmin
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : isStaff
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-teal-50 text-teal-700 border-teal-200"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-slate-600">
                          {u.phone ? (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not provided</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          {isAdmin ? (
                            <span className="text-[10px] text-slate-400 italic font-medium px-2 py-1">
                              Protected
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(u)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0 rounded-lg"
                              title="Delete account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-rose-200 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-base text-slate-900">Delete User Account?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
