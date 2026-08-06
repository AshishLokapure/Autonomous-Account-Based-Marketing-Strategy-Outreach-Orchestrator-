"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, Send, Mail, Bot, Bell, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { getSettings, upsertSettings, updatePassword, UserSettings } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  { id: "profile", label: "Profile Settings", icon: User },
  { id: "password", label: "Security", icon: Lock },
  { id: "automation", label: "Campaign Automation", icon: Send },
  { id: "email", label: "Email Preferences", icon: Mail },
  { id: "ai", label: "AI Preferences", icon: Bot },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsModule() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [settings, setSettings] = useState<Partial<UserSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadSettings(user.id);
    }
  }, [user]);

  const loadSettings = async (userId: string) => {
    try {
      setIsLoading(true);
      const res = await getSettings(userId);
      setSettings(res.data || {});
    } catch (err) {
      console.error("Failed to load settings, using defaults.", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    if (!user?.id) return;
    try {
      setIsSaving(true);
      setSaveMessage(null);
      await upsertSettings({ ...settings, user_id: user.id } as UserSettings);
      setSaveMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSaveMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (newPassword !== confirmPassword) {
      setSaveMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setSaveMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    try {
      setIsSaving(true);
      setSaveMessage(null);
      await updatePassword({ user_id: user.id, new_password: newPassword });
      setSaveMessage({ type: "success", text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update password:", err);
      setSaveMessage({ type: "error", text: "Failed to update password. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 20;
    if (pass.match(/[a-z]/)) score += 20;
    if (pass.match(/[A-Z]/)) score += 20;
    if (pass.match(/[0-9]/)) score += 20;
    if (pass.match(/[^a-zA-Z0-9]/)) score += 20;
    return score;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      {/* Sidebar Navigation */}
      <div className="settings-sidebar">
        <h2 className="settings-sidebar-title">Settings</h2>
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`settings-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} className="nav-icon" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="settings-main">
        <div className="settings-content-wrapper">
          
          <AnimatePresence mode="wait">
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 rounded-md flex items-center gap-3 ${
                  saveMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {saveMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <p className="text-sm font-medium">{saveMessage.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Section: Profile Settings */}
            {activeSection === "profile" && (
              <div className="settings-card">
                <h3 className="settings-card-title">Profile Settings</h3>
                <div className="settings-grid">
                  <div className="form-group full-width">
                    <label>Email Address</label>
                    <input type="email" disabled value={user?.email || ""} className="disabled-input" />
                    <p className="help-text">Your email address cannot be changed.</p>
                  </div>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={settings.full_name || ""} onChange={(e) => handleChange("full_name", e.target.value)} placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" value={settings.phone_number || ""} onChange={(e) => handleChange("phone_number", e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="form-group">
                    <label>Company Name</label>
                    <input type="text" value={settings.company_name || ""} onChange={(e) => handleChange("company_name", e.target.value)} placeholder="Acme Inc." />
                  </div>
                  <div className="form-group">
                    <label>Designation</label>
                    <input type="text" value={settings.designation || ""} onChange={(e) => handleChange("designation", e.target.value)} placeholder="Marketing Director" />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Security */}
            {activeSection === "password" && (
              <div className="settings-card">
                <h3 className="settings-card-title">Security</h3>
                <form onSubmit={handlePasswordUpdate} className="settings-form">
                  <div className="form-group full-width">
                    <label>New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
                    {newPassword && (
                      <div className="password-strength-container">
                        <div 
                          className={`password-strength-bar ${getPasswordStrength(newPassword) < 50 ? 'weak' : getPasswordStrength(newPassword) < 80 ? 'medium' : 'strong'}`} 
                          style={{ width: `${getPasswordStrength(newPassword)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="form-group full-width">
                    <label>Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
                  </div>
                  <button type="submit" disabled={isSaving} className="primary-btn">
                    {isSaving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}

            {/* Section: Campaign Automation */}
            {activeSection === "automation" && (
              <div className="settings-card">
                <h3 className="settings-card-title">Campaign Automation</h3>
                <div className="settings-box">
                  <div className="toggle-container">
                    <label className="toggle-switch">
                      <input type="checkbox" checked={!!settings.auto_send_email} onChange={(e) => handleChange("auto_send_email", e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="box-content">
                    <h4>Auto-Send Outreach Emails</h4>
                    <p>
                      When enabled, emails generated by the Outreach Agent will be sent automatically to the identified decision makers. If disabled, emails will be saved as drafts for your review in the Outreach Studio.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Email Preferences */}
            {activeSection === "email" && (
              <div className="settings-card">
                <h3 className="settings-card-title">Email Preferences</h3>
                <div className="settings-grid">
                  <div className="form-group">
                    <label>Sender Name</label>
                    <input type="text" value={settings.sender_name || ""} onChange={(e) => handleChange("sender_name", e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div className="form-group">
                    <label>Reply-To Email</label>
                    <input type="email" value={settings.reply_email || ""} onChange={(e) => handleChange("reply_email", e.target.value)} placeholder="jane@example.com" />
                  </div>
                  <div className="form-group full-width">
                    <label>Default Signature</label>
                    <textarea rows={4} value={settings.email_signature || ""} onChange={(e) => handleChange("email_signature", e.target.value)} placeholder="Best regards,\nJane Doe\nAcme Inc." />
                  </div>
                </div>
              </div>
            )}

            {/* Section: AI Preferences */}
            {activeSection === "ai" && (
              <div className="settings-card">
                <h3 className="settings-card-title">AI Preferences</h3>
                <div className="settings-grid">
                  <div className="form-group full-width">
                    <label>Email Length</label>
                    <select value={settings.email_length || "Medium"} onChange={(e) => handleChange("email_length", e.target.value)}>
                      <option value="Short">Short (Under 100 words)</option>
                      <option value="Medium">Medium (100-250 words)</option>
                      <option value="Long">Long (Detailed context)</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Creativity (Temperature)</label>
                    <input type="range" min="0" max="1" step="0.1" value={settings.temperature || 0.7} onChange={(e) => handleChange("temperature", parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      <span>Strict / Predictable</span>
                      <span>Creative / Varied</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Notifications */}
            {activeSection === "notifications" && (
              <div className="settings-card">
                <h3 className="settings-card-title">Notifications</h3>
                <div className="settings-grid">
                  <div className="settings-box">
                    <div className="toggle-container">
                      <label className="toggle-switch">
                        <input type="checkbox" checked={!!settings.notify_email_opened} onChange={(e) => handleChange("notify_email_opened", e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="box-content">
                      <h4>Email Opened</h4>
                      <p>Receive a notification when a prospect opens your email.</p>
                    </div>
                  </div>
                  <div className="settings-box">
                    <div className="toggle-container">
                      <label className="toggle-switch">
                        <input type="checkbox" checked={!!settings.notify_campaign_complete} onChange={(e) => handleChange("notify_campaign_complete", e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="box-content">
                      <h4>Campaign Completed</h4>
                      <p>Receive a notification when a campaign successfully finishes orchestration.</p>
                    </div>
                  </div>
                  <div className="settings-box">
                    <div className="toggle-container">
                      <label className="toggle-switch">
                        <input type="checkbox" checked={!!settings.notify_agent_failure} onChange={(e) => handleChange("notify_agent_failure", e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="box-content">
                      <h4>Agent Failure</h4>
                      <p>Alert me if an AI agent encounters an error.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Footer */}
            {activeSection !== "password" && (
              <div className="settings-footer">
                <button onClick={handleSaveSettings} disabled={isSaving} className="primary-btn flex-center">
                  <Save size={16} style={{ marginRight: 8 }} />
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .settings-container {
          display: flex;
          height: 100vh;
          background-color: var(--canvas);
          overflow: hidden;
        }
        .settings-sidebar {
          width: 250px;
          background-color: var(--surface);
          border-right: 1px solid var(--border-soft);
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .settings-sidebar-title {
          font-size: var(--text-section);
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 20px;
          padding: 0 10px;
        }
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-control);
          font-size: var(--text-body);
          font-weight: 600;
          color: var(--muted);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .settings-nav-item:hover {
          background-color: var(--border-soft);
          color: var(--ink);
        }
        .settings-nav-item.active {
          background-color: var(--violet-soft);
          color: var(--violet);
        }
        .nav-icon {
          color: inherit;
        }
        .settings-main {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
        }
        .settings-content-wrapper {
          max-width: 760px;
          margin: 0 auto;
        }
        .settings-card {
          background: var(--surface);
          border: 1px solid var(--border-soft);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 30px;
          margin-bottom: 24px;
        }
        .settings-card-title {
          font-size: var(--text-title);
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 24px;
        }
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .form-group label {
          font-size: var(--text-label);
          font-weight: 700;
          color: var(--ink-soft);
        }
        .form-group input, .form-group select, .form-group textarea {
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-control);
          font-size: var(--text-body);
          font-family: inherit;
          color: var(--ink);
          background: var(--surface);
          transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: var(--violet);
        }
        .disabled-input {
          background: var(--border-soft) !important;
          color: var(--muted) !important;
          cursor: not-allowed;
        }
        .help-text {
          font-size: var(--text-caption);
          color: var(--muted);
          margin: 0;
        }
        .settings-form {
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .password-strength-container {
          margin-top: 8px;
          height: 6px;
          width: 100%;
          background: var(--border-soft);
          border-radius: 4px;
          overflow: hidden;
        }
        .password-strength-bar {
          height: 100%;
          transition: width 0.3s;
        }
        .weak { background: var(--danger); }
        .medium { background: var(--warning); }
        .strong { background: var(--success); }
        .primary-btn {
          background: var(--violet);
          color: white;
          padding: 10px 18px;
          border: none;
          border-radius: var(--radius-control);
          font-size: var(--text-body);
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .primary-btn:hover {
          background: #6c54e6;
        }
        .primary-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .settings-footer {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        .settings-box {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          border: 1px solid var(--border-soft);
          border-radius: var(--radius-control);
          background: var(--canvas);
          grid-column: 1 / -1;
        }
        .toggle-container {
          margin-top: 2px;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--border);
          transition: .3s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: var(--violet);
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        .box-content h4 {
          font-size: var(--text-body);
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 4px 0;
        }
        .box-content p {
          font-size: var(--text-caption);
          color: var(--muted);
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
