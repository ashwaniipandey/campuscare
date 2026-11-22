"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Shield,
  Activity,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAmbulancesPage() {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    driverName: "",
    email: "",
    password: "",
    phone: "",
    type: "basic",
  });

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  const fetchAmbulances = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ambulances");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load ambulances");
      }
      const data = await res.json();
      setAmbulances(data.ambulances || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmbulances();
  }, [fetchAmbulances]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAmbulance = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/ambulances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register ambulance");
      }

      setSuccess(`Ambulance ${data.ambulance?.vehicleNumber || ""} successfully registered.`);
      setShowAddModal(false);
      setFormData({
        vehicleNumber: "",
        driverName: "",
        email: "",
        password: "",
        phone: "",
        type: "basic",
      });
      fetchAmbulances();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAmbulance = async (id, vehicleNumber) => {
    if (!confirm(`Are you sure you want to delete ambulance ${vehicleNumber}? This will also remove the driver's login account.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/ambulances/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete ambulance");
      }
      setSuccess(`Ambulance ${vehicleNumber} deleted.`);
      fetchAmbulances();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        );
      case "busy":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Busy (On Mission)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Offline
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-1">
              <Truck className="w-3.5 h-3.5" />
              <span>Campus Emergency Fleet</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ambulance Registry &amp; Dispatch Fleet
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage rapid response vehicles, driver credentials, live telemetry, and duty status.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAmbulances}
              disabled={loading}
              className="gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Fleet</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setFormError("");
                setShowAddModal(true);
              }}
              className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ambulance</span>
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} className="font-bold underline text-rose-700 dark:text-rose-400 ml-2">
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="font-bold underline text-emerald-700 dark:text-emerald-400 ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* Ambulances Table Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Registered Vehicles ({ambulances.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {ambulances.filter((a) => a.status === "available").length} Active / Available
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Loading fleet registry...</span>
            </div>
          ) : ambulances.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Truck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No ambulances registered yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Click &ldquo;Add Ambulance&rdquo; above to create a vehicle profile and driver login.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Vehicle</th>
                    <th className="py-3 px-4 sm:px-6">Type</th>
                    <th className="py-3 px-4 sm:px-6">Driver &amp; Contact</th>
                    <th className="py-3 px-4 sm:px-6">Status</th>
                    <th className="py-3 px-4 sm:px-6">Last GPS Location</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                  {ambulances.map((amb) => (
                    <tr
                      key={amb._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      {/* Vehicle */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm block">
                              {amb.vehicleNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              ID: {amb._id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                            amb.type === "advanced"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {amb.type === "advanced" ? "Advanced (ALS)" : "Basic (BLS)"}
                        </span>
                      </td>

                      {/* Driver & Contact */}
                      <td className="py-3.5 px-4 sm:px-6 space-y-0.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {amb.driverName}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{amb.driverPhone}</span>
                        </div>
                        {amb.user?.email && (
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px]">
                            <Mail className="w-3 h-3" />
                            <span>{amb.user.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 sm:px-6">
                        {getStatusBadge(amb.status)}
                      </td>

                      {/* Last Location */}
                      <td className="py-3.5 px-4 sm:px-6">
                        {amb.location?.latitude != null && amb.location?.longitude != null ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>
                                {amb.location.latitude.toFixed(4)}, {amb.location.longitude.toFixed(4)}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                              Updated{" "}
                              {amb.location.updatedAt
                                ? new Date(amb.location.updatedAt).toLocaleTimeString()
                                : "N/A"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            No GPS telemetry yet
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAmbulance(amb._id, amb.vehicleNumber)}
                          disabled={deletingId === amb._id}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-2 h-auto rounded-lg"
                        >
                          {deletingId === amb._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Add Ambulance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Register New Ambulance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAmbulance} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    required
                    placeholder="e.g. AMB-05"
                    value={formData.vehicleNumber}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ambulance Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="basic">Basic (BLS)</option>
                    <option value="advanced">Advanced Life Support (ALS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    name="driverName"
                    required
                    placeholder="e.g. Michael Harris"
                    value={formData.driverName}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Phone (10 digits) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Login Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="driver@campuscare.edu"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Password (min 6) *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Registering...
                    </>
                  ) : (
                    "Register Ambulance"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
