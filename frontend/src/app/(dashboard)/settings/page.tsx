"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@store/useAuthStore";
import { authService } from "@services/auth.service";
import { leadService } from "@/services/lead.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Alert, AlertDescription } from "@components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@components/ui/dialog";
import { Loader2, Lock, ShieldAlert, AlertTriangle, Download, Trash2, CheckCircle2, Settings } from "lucide-react";
import { toast } from "sonner";

type DeleteStep = "idle" | "exporting" | "downloading" | "confirm" | "deleting" | "done";

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete state
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("idle");
  const [deleteError, setDeleteError] = useState("");

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authService.changePassword(currentPassword, newPassword);

      if (response.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password changed successfully. Please login again.");
        clearAuth();
        localStorage.removeItem("authToken");
        document.cookie = "accessToken=; path=/; max-age=0";
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("authToken");
    document.cookie = "accessToken=; path=/; max-age=0";
    router.push("/login");
  };

  const handleDeleteAllLeads = async () => {
    try {
      setDeleteStep("exporting");
      setDeleteError("");

      const blob = await leadService.exportExcel({});

      setDeleteStep("downloading");

      const today = new Date().toISOString().split("T")[0];
      leadService.downloadFile(
        blob,
        `leads-backup-${today}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      setDeleteStep("confirm");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to export backup");
      setDeleteStep("idle");
      toast.error("Backup export failed. Deletion cancelled.");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteStep("deleting");

      const response = await leadService.deleteAllLeads();

      if (response.success) {
        setDeleteStep("done");
        toast.success("All leads deleted successfully");
        setTimeout(() => {
          setDeleteStep("idle");
        }, 2000);
      } else {
        throw new Error(response.message || "Delete failed");
      }
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete leads");
      setDeleteStep("idle");
      toast.error("Failed to delete leads");
    }
  };

  const handleCancelDelete = () => {
    setDeleteStep("idle");
    setDeleteError("");
  };

  return (
    <div suppressHydrationWarning className="w-full max-w-full px-4 py-6 sm:px-6 lg:px-8 bg-[#F5F3EF] min-h-screen">
      <div className="mb-8 flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-[11px] flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
            boxShadow: "0 1px 6px rgba(29,78,216,0.22)",
          }}
        >
          <Settings className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold text-[#18181B] tracking-[-0.025em] leading-tight">
            Settings
          </h1>
          <p className="text-[12.5px] text-[#8E8C86] mt-0.5 leading-tight">
            Admin account settings and security
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[11px] p-4 mb-6">
          <p className="text-[13px] text-red-900">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-[14px] border border-[#E8E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="border-b border-[#E8E5DF] px-5 py-4">
            <h3 className="text-[14px] font-semibold text-[#18181B]">Change Password</h3>
            <p className="text-[12px] text-[#B0AEA8] mt-1">Update your admin password</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-[13px] font-medium text-[#52525B]">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B0AEA8]" strokeWidth={1.8} />
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-9 pl-10 pr-3.5 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] text-[13px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-[13px] font-medium text-[#52525B]">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B0AEA8]" strokeWidth={1.8} />
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  className="w-full h-9 pl-10 pr-3.5 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] text-[13px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[13px] font-medium text-[#52525B]">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B0AEA8]" strokeWidth={1.8} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  minLength={8}
                  className="w-full h-9 pl-10 pr-3.5 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] text-[13px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
                />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="w-full h-10 px-5 rounded-[9px] text-[13.5px] font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
                boxShadow: "0 1px 4px rgba(29,78,216,0.25)",
              }}
            >
              {loading && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Changing Password..." : "Change Password"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E8E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="border-b border-[#E8E5DF] px-5 py-4">
            <h3 className="text-[14px] font-semibold text-[#18181B]">Session</h3>
            <p className="text-[12px] text-[#B0AEA8] mt-1">Manage your current session</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[13px] text-[#52525B] mb-4">
              Your session lasts for 8 hours. You can log out manually at any time.
            </p>
            <button
              onClick={handleLogout}
              className="w-full h-10 px-5 rounded-[9px] border border-[#FECACA] bg-[#FEF2F2] text-[13.5px] font-semibold text-[#DC2626] hover:bg-[#FCA5A5] hover:border-[#FECACA] transition-all duration-150 active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 bg-white rounded-[14px] border border-[#DC2626]/50 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="border-b border-[#DC2626]/50 px-5 py-4 flex flex-row items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-[#DC2626] shrink-0" strokeWidth={1.8} />
          <div>
            <h3 className="text-[14px] font-semibold text-[#DC2626]">Danger Zone</h3>
            <p className="text-[12px] text-[#B0AEA8] mt-1">
              Irreversible destructive actions
            </p>
          </div>
        </div>
        <div className="px-5 py-4">
          {deleteError && (
            <div className="bg-red-50 border border-red-200 rounded-[11px] p-4 mb-4">
              <p className="text-[13px] text-red-900">{deleteError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[11px] border border-[#DC2626]/20 bg-[#FEF2F2] p-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-[13.5px] flex items-center gap-2 text-[#DC2626]">
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                Delete All Leads
              </h4>
              <p className="text-[12.5px] text-[#8E8C86]">
                Permanently delete every lead from the database. A backup Excel file will be
                downloaded before deletion.
              </p>
            </div>
            <button
              onClick={handleDeleteAllLeads}
              disabled={
                deleteStep === "exporting" ||
                deleteStep === "downloading" ||
                deleteStep === "deleting"
              }
              className="h-10 px-4 rounded-[9px] border border-[#FECACA] bg-[#FEF2F2] text-[13.5px] font-semibold text-[#DC2626] hover:bg-[#FCA5A5] hover:border-[#FECACA] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
            >
              {deleteStep === "exporting" && (
                <>
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Exporting backup...
                </>
              )}
              {deleteStep === "downloading" && (
                <>
                  <Download className="inline mr-2 h-4 w-4 animate-spin" />
                  Downloading file...
                </>
              )}
              {deleteStep === "deleting" && (
                <>
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Deleting database...
                </>
              )}
              {(deleteStep === "idle" || deleteStep === "confirm" || deleteStep === "done") && (
                <>
                  <Trash2 className="inline mr-2 h-4 w-4" strokeWidth={1.8} />
                  Delete All Leads
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={deleteStep === "confirm"} onOpenChange={(open) => { if (!open) handleCancelDelete(); }}>
        <DialogContent className="sm:max-w-md rounded-[14px]" style={{ backgroundColor: "#FAFAF8", border: "1px solid #E8E5DF" }}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-[#DC2626]" strokeWidth={1.8} />
              <DialogTitle className="text-[16px] font-semibold text-[#18181B]">Delete All Leads</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-[13px] text-[#52525B]">
              This action will permanently delete all leads from the database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-[11px] border border-green-200 bg-[#ECFDF5] p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" strokeWidth={1.8} />
              <p className="text-[12px] text-green-700">
                A backup Excel file has already been downloaded.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-[11px] border border-orange-200 bg-[#FFFBEB] p-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" strokeWidth={1.8} />
              <p className="text-[12px] text-orange-700">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={handleCancelDelete}
              className="h-9 px-4 rounded-[9px] border border-[#E4E1DB] bg-white text-[13px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="h-9 px-4 rounded-[9px] border border-[#FECACA] bg-[#FEF2F2] text-[13px] font-semibold text-[#DC2626] hover:bg-[#FCA5A5] hover:border-[#FECACA] transition-all duration-150 active:scale-[0.98]"
            >
              Delete Permanently
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}