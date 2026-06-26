import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Video, 
  Download, 
  Copy, 
  Upload, 
  LogIn, 
  LogOut, 
  Check, 
  Grid, 
  User, 
  AlertCircle, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  RefreshCw, 
  X, 
  Search, 
  Shield, 
  Menu,
  FileVideo,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProfileIcon, ActiveTab, AdminSession, SavedCaption } from "./types";

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<ActiveTab>("welcome");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  // User States (Caption Generator)
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("mrx_creator_username") || "";
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoContext, setVideoContext] = useState("");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simulatedMessage, setSimulatedMessage] = useState("");

  // Profile Icons Library States
  const [icons, setIcons] = useState<ProfileIcon[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<ProfileIcon | null>(null);

  // Saved Captions History States
  const [savedCaptions, setSavedCaptions] = useState<SavedCaption[]>([]);

  // Admin States
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    const saved = localStorage.getItem("mrx_admin_session");
    return saved ? JSON.parse(saved) : null;
  });

  // Admin Manage Images States
  const [newImageTitle, setNewImageTitle] = useState("");
  const [newImageCategory, setNewImageCategory] = useState("Cyberpunk");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newImageIsPublic, setNewImageIsPublic] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [adminImages, setAdminImages] = useState<ProfileIcon[]>([]);

  // Drag & drop states
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAdminDragOver, setIsAdminDragOver] = useState(false);

  // Load profile icons
  const loadIcons = async () => {
    try {
      const headers: HeadersInit = {};
      if (adminSession) {
        headers["Authorization"] = `Bearer ${adminSession.token}`;
      }
      const res = await fetch("/api/images", { headers });
      if (res.ok) {
        const data = await res.json();
        setIcons(data.images || []);
        if (adminSession) {
          setAdminImages(data.images || []);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar ícones:", err);
    }
  };

  // Load saved captions history from server DB
  const loadSavedCaptions = async () => {
    try {
      const res = await fetch("/api/legendas");
      if (res.ok) {
        const data = await res.json();
        setSavedCaptions(data.captions || []);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico de legendas:", err);
    }
  };

  // Delete caption from history
  const handleDeleteCaption = async (id: string) => {
    try {
      const res = await fetch(`/api/legendas/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedCaptions((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Erro ao excluir legenda do histórico:", err);
    }
  };

  useEffect(() => {
    loadIcons();
    loadSavedCaptions();
  }, [adminSession]);

  // Save username to local storage
  useEffect(() => {
    localStorage.setItem("mrx_creator_username", username);
  }, [username]);

  // Handle Video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoPreviewUrl(url);
      }
    }
  };

  // Generate Caption with AI
  const handleGenerateCaption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setGeneratedCaption("");
    setIsEditingCaption(false);
    setIsSimulated(false);
    setSimulatedMessage("");

    // Simulate tech steps for gorgeous interactive loader
    const steps = [
      "Iniciando inteligência artificial...",
      "Processando metadados do vídeo...",
      "Analisando ganchos de alto impacto...",
      "Escrevendo corpo persuasivo e CTAs...",
      "Formatando hashtags e emojis virais..."
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);

    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setLoadingStep(steps[stepIndex]);
      }
    }, 900);

    try {
      let fileBase64 = "";
      let mimeType = "";
      
      if (videoFile) {
        setLoadingStep("Processando e otimizando arquivo de vídeo para a IA...");
        try {
          fileBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(videoFile);
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result?.split(",")[1] || "";
              resolve(base64);
            };
            reader.onerror = (error) => reject(error);
          });
          mimeType = videoFile.type || "video/mp4";
        } catch (err) {
          console.error("Erro ao ler o arquivo de vídeo:", err);
        }
      }

      const response = await fetch("/api/legendas/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          context: videoContext,
          fileName: videoFile ? videoFile.name : "video_analisado.mp4",
          fileData: fileBase64 || undefined,
          mimeType: mimeType || undefined,
        }),
      });

      clearInterval(stepInterval);

      if (response.ok) {
        const data = await response.json();
        setGeneratedCaption(data.caption);
        setEditedCaption(data.caption);
        setIsSimulated(!!data.isSimulated);
        setSimulatedMessage(data.message || "");
        loadSavedCaptions();
      } else {
        const errData = await response.json();
        setGeneratedCaption(`Ocorreu um erro: ${errData.error || "Tente novamente."}`);
      }
    } catch (err) {
      clearInterval(stepInterval);
      setGeneratedCaption("Falha na conexão com o servidor de IA. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Admin Login Handle
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        const session: AdminSession = {
          token: data.token,
          username: data.user.username,
          role: data.user.role,
        };
        setAdminSession(session);
        localStorage.setItem("mrx_admin_session", JSON.stringify(session));
        // Clear login form
        setAdminUsername("");
        setAdminPassword("");
      } else {
        const errorData = await res.json();
        setAdminError(errorData.error || "Senha ou usuário incorretos.");
      }
    } catch (err) {
      setAdminError("Erro ao conectar ao servidor de login.");
    }
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setAdminSession(null);
    localStorage.removeItem("mrx_admin_session");
  };

  // Admin Handle Image Upload (Base64 conversion)
  const handleAdminImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onAdminDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsAdminDragOver(true);
  };

  const onAdminDragLeave = () => {
    setIsAdminDragOver(false);
  };

  const onAdminDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsAdminDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setNewImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Admin Image Upload Submission
  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSession || !newImagePreview || !newImageTitle) return;

    setUploadProgress(true);

    try {
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify({
          title: newImageTitle,
          category: newImageCategory,
          fileData: newImagePreview,
          fileName: newImageFile ? newImageFile.name : "icon.jpg",
          isPublic: newImageIsPublic,
        }),
      });

      if (res.ok) {
        // Clear form
        setNewImageTitle("");
        setNewImageFile(null);
        setNewImagePreview(null);
        // Reload icons
        await loadIcons();
      } else {
        const data = await res.json();
        alert(`Erro de upload: ${data.error}`);
      }
    } catch (err) {
      alert("Erro ao enviar imagem ao servidor.");
    } finally {
      setUploadProgress(false);
    }
  };

  // Admin Delete Image
  const handleDeleteImage = async (id: string) => {
    if (!adminSession) return;
    if (!confirm("Tem certeza que deseja excluir esta foto de perfil permanentemente?")) return;

    try {
      const res = await fetch(`/api/admin/images/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${adminSession.token}`,
        },
      });

      if (res.ok) {
        await loadIcons();
      } else {
        const data = await res.json();
        alert(`Erro ao excluir: ${data.error}`);
      }
    } catch (err) {
      alert("Erro ao se comunicar com o servidor.");
    }
  };

  // Admin Toggle Public Image
  const handleTogglePublic = async (id: string) => {
    if (!adminSession) return;

    try {
      const res = await fetch(`/api/admin/images/${id}/toggle`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${adminSession.token}`,
        },
      });

      if (res.ok) {
        await loadIcons();
      } else {
        const data = await res.json();
        alert(`Erro ao atualizar visibilidade: ${data.error}`);
      }
    } catch (err) {
      alert("Erro de conexão ao servidor.");
    }
  };

  // Download Profile Picture trigger
  const handleDownloadIcon = async (icon: ProfileIcon) => {
    try {
      const imageUrl = `/uploads/${icon.filename}`;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${icon.title.replace(/\s+/g, "_") || "icon"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const imageUrl = `/uploads/${icon.filename}`;
      const link = document.createElement("a");
      link.href = imageUrl;
      link.target = "_blank";
      link.download = icon.title || "dark_ia_icon.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 1-click Copy Caption
  const handleCopyCaption = () => {
    const textToCopy = isEditingCaption ? editedCaption : generatedCaption;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter and search Icons logic
  const filteredIcons = icons.filter((icon) => {
    const matchesCategory = selectedCategory === "Todos" || icon.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = icon.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          icon.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Unique categories for filtering derived from current icons list
  const availableCategories = ["Todos", "Cyberpunk", "Minimalista", "IA", "Outros"];

  return (
    <div id="app_root" className="min-h-screen bg-[#000000] text-gray-100 font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden bg-grid-cyber">
      
      {/* Retro scanlines overlay for futuristic ambient vibes */}
      <div className="pointer-events-none fixed inset-0 scanlines opacity-[0.03] z-50" />

      {/* Header */}
      <header id="main_header" className="sticky top-0 z-40 w-full bg-[#000000]/85 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 py-4">
        <div id="header_container" className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div id="brand_logo" className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("welcome")}>
            <div className="w-10 h-10 rounded-xl bg-instagram-gradient flex items-center justify-center shadow-lg shadow-pink-500/15">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-instagram-gradient">
                DARK IA
              </span>
              <span className="text-[10px] block font-mono text-orange-400/80 tracking-widest uppercase -mt-1">
                INSTA PRESET ENGINE
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav id="desktop_nav" className="hidden md:flex items-center gap-1 bg-white/5 border border-white/5 rounded-full p-1">
            <button
              id="tab_welcome"
              onClick={() => setActiveTab("welcome")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === "welcome" || activeTab === "menu"
                  ? "bg-instagram-gradient text-white shadow-md shadow-pink-500/15" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Início
            </button>
            <button
              id="tab_caption"
              onClick={() => { setActiveTab("caption-generator"); setIsMobileMenuOpen(false); }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === "caption-generator" 
                  ? "bg-instagram-gradient text-white shadow-md shadow-pink-500/15" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Gerador de Legendas
            </button>
            <button
              id="tab_icons"
              onClick={() => { setActiveTab("profile-icons"); setIsMobileMenuOpen(false); }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === "profile-icons" 
                  ? "bg-instagram-gradient text-white shadow-md shadow-pink-500/15" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Biblioteca de Ícones
            </button>
          </nav>

          {/* User Profile / Admin Quick Access */}
          <div id="quick_access" className="hidden md:flex items-center gap-3">
            {adminSession ? (
              <div className="flex items-center gap-3">
                <button
                  id="admin_active_badge"
                  onClick={() => setActiveTab("admin")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === "admin"
                      ? "border-[#E1306C] bg-[#E1306C]/10 text-pink-400"
                      : "border-[#C13584]/30 bg-purple-950/20 text-[#E1306C] hover:border-[#E1306C]"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Painel Admin
                </button>
                <button
                  id="btn_logout"
                  onClick={handleAdminLogout}
                  className="p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all"
                  title="Sair do Admin"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn_admin_login"
                onClick={() => setActiveTab("admin")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border border-white/10 text-gray-400 hover:text-white hover:border-[#E1306C]/50 transition-all flex items-center gap-2 ${
                  activeTab === "admin" ? "border-[#E1306C] text-[#E1306C] bg-[#E1306C]/5" : ""
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Área Restrita
              </button>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <button
            id="mobile_menu_trigger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile_menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#07041d] border-b border-white/5 overflow-hidden sticky top-[73px] z-30"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              <button
                id="mobile_tab_welcome"
                onClick={() => { setActiveTab("welcome"); setIsMobileMenuOpen(false); }}
                className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-left ${
                  activeTab === "welcome" || activeTab === "menu"
                    ? "bg-instagram-gradient text-white" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Início
              </button>
              <button
                id="mobile_tab_caption"
                onClick={() => { setActiveTab("caption-generator"); setIsMobileMenuOpen(false); }}
                className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-left ${
                  activeTab === "caption-generator" 
                    ? "bg-instagram-gradient text-white" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Video className="w-4 h-4" />
                Gerador de Legendas
              </button>
              <button
                id="mobile_tab_icons"
                onClick={() => { setActiveTab("profile-icons"); setIsMobileMenuOpen(false); }}
                className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-left ${
                  activeTab === "profile-icons" 
                    ? "bg-instagram-gradient text-white" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Grid className="w-4 h-4" />
                Biblioteca de Ícones
              </button>

              <div className="h-[1px] bg-white/5 my-1" />

              {adminSession ? (
                <div className="flex flex-col gap-2">
                  <button
                    id="mobile_tab_admin"
                    onClick={() => { setActiveTab("admin"); setIsMobileMenuOpen(false); }}
                    className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm font-medium text-left border ${
                      activeTab === "admin" 
                        ? "bg-[#E1306C]/10 border-[#E1306C] text-[#E1306C]" 
                        : "border-[#C13584]/20 text-[#E1306C]"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Acessar Admin
                  </button>
                  <button
                    id="mobile_logout"
                    onClick={() => { handleAdminLogout(); setIsMobileMenuOpen(false); }}
                    className="w-full py-3 px-4 rounded-xl text-left text-red-400 hover:bg-red-950/20 flex items-center gap-3 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair do Admin
                  </button>
                </div>
              ) : (
                <button
                  id="mobile_admin_login"
                  onClick={() => { setActiveTab("admin"); setIsMobileMenuOpen(false); }}
                  className="w-full py-3 px-4 rounded-xl text-left text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-3 text-sm"
                >
                  <User className="w-4 h-4" />
                  Acesso Restrito Admin
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main id="main_content_container" className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        
        {/* WELCOME TO DARK IA SCREEN */}
        {activeTab === "welcome" && (
          <motion.div
            id="view_welcome_dark_ia"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center py-12 md:py-20 max-w-3xl mx-auto"
          >
            {/* Pulsing Core Icon with intense multi-color glowing aura */}
            <div className="relative mb-8 group cursor-pointer">
              <div className="absolute -inset-1 rounded-full bg-instagram-gradient blur-xl opacity-75 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-[#080518]/90 border border-white/10 flex items-center justify-center text-[#E1306C] glow-rainbow">
                <Sparkles className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            {/* Glowing Tagline */}
            <span className="px-4 py-1.5 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/30 text-xs font-bold text-[#E1306C] uppercase tracking-widest animate-pulse">
              Bem-vindo ao Futuro da Criação
            </span>

            {/* High-impact Title */}
            <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-white mt-6 select-none leading-none">
              <span className="text-instagram-gradient">DARK IA</span>
            </h1>

            {/* Premium Description */}

            {/* Pulsing interactive CTA button */}
            <button
              id="btn_welcome_start"
              onClick={() => setActiveTab("menu")}
              className="group relative mt-10 px-8 py-4 rounded-xl bg-instagram-gradient text-white font-bold text-sm uppercase tracking-wider transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="flex items-center gap-3 relative z-10">
                Começar Agora
                <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform animate-pulse" />
              </span>
            </button>
          </motion.div>
        )}

        {/* DARK IA MENU SCREEN */}
        {activeTab === "menu" && (
          <motion.div
            id="view_menu_selection"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto py-8 md:py-16 space-y-10"
          >
            {/* Header text */}
            <div className="text-center space-y-3">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#C13584]/15 to-[#FCAF45]/15 border border-[#E1306C]/30 text-[10px] font-bold text-[#E1306C] uppercase tracking-widest">
                Painel de Ferramentas
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
                Selecione o seu Poder
              </h2>
            </div>

            {/* Two Sleek Interactive Glowing Cards */}
            <div className="grid md:grid-cols-2 gap-6 w-full">
              
              {/* Card 1: Gerador de Legendas */}
              <div
                onClick={() => setActiveTab("caption-generator")}
                className="glass-card rounded-2xl p-6 md:p-8 border border-white/5 hover:border-[#E1306C]/40 cursor-pointer relative overflow-hidden group hover:shadow-[#E1306C]/10 select-none"
              >
                {/* Visual hover color splash */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#E1306C]/10 rounded-full blur-2xl group-hover:bg-[#C13584]/20 transition-all duration-300" />
                
                <div className="w-12 h-12 rounded-xl p-[1.5px] bg-white/10 group-hover:bg-instagram-gradient mb-6 transition-all duration-300 group-hover:scale-110">
                  <div className="w-full h-full rounded-xl bg-[#030014]/90 flex items-center justify-center text-[#E1306C] group-hover:text-white transition-colors">
                    <Video className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-display font-bold text-white text-xl group-hover:text-[#E1306C] transition-colors">
                  Gerador de Legendas
                </h3>
                
                <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                  Escreva roteiros, gere ganchos virais irresistíveis e crie legendas altamente persuasivas com o nosso motor de IA adaptativa de alta performance.
                </p>

                <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-instagram-gradient group-hover:translate-x-1.5 transition-transform">
                  <span>Acessar Gerador</span>
                  <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                </div>
              </div>

              {/* Card 2: Biblioteca de Ícones */}
              <div
                onClick={() => setActiveTab("profile-icons")}
                className="glass-card rounded-2xl p-6 md:p-8 border border-white/5 hover:border-[#E1306C]/40 cursor-pointer relative overflow-hidden group hover:shadow-[#E1306C]/10 select-none"
              >
                {/* Visual hover color splash */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#FCAF45]/10 rounded-full blur-2xl group-hover:bg-[#E1306C]/20 transition-all duration-300" />
                
                <div className="w-12 h-12 rounded-xl p-[1.5px] bg-white/10 group-hover:bg-instagram-gradient mb-6 transition-all duration-300 group-hover:scale-110">
                  <div className="w-full h-full rounded-xl bg-[#030014]/90 flex items-center justify-center text-[#FCAF45] group-hover:text-white transition-colors">
                    <Grid className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-display font-bold text-white text-xl group-hover:text-[#E1306C] transition-colors">
                  Ícones para Perfil
                </h3>
                
                <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                  Acesse nossa biblioteca exclusiva de fotos de perfil cyberpunk e futuristas, otimizadas para gerar autoridade e misteriosa curiosidade nas redes sociais.
                </p>

                <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-instagram-gradient group-hover:translate-x-1.5 transition-transform">
                  <span>Acessar Ícones</span>
                  <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                </div>
              </div>

            </div>

            {/* Back button */}
            <div className="text-center">
              <button
                onClick={() => setActiveTab("welcome")}
                className="px-4 py-2 rounded-xl text-gray-500 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all hover:bg-white/5"
              >
                ← Voltar para o início
              </button>
            </div>

          </motion.div>
        )}

        {/* TAB 1: AI Caption Generator */}
        {activeTab === "caption-generator" && (
          <motion.div
            id="view_caption_generator"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid lg:grid-cols-12 gap-8 lg:gap-12"
          >
            {/* Header Text */}
            <div className="lg:col-span-12 mb-2 text-center lg:text-left">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#C13584]/15 to-[#FCAF45]/15 border border-[#E1306C]/30 text-xs font-semibold text-[#E1306C] uppercase tracking-widest">
                Gerador de Legendas com IA
              </span>
              <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-white mt-3">
                Crie Legendas <span className="text-instagram-gradient">Altamente Virais</span>
              </h1>
              <p className="text-gray-400 mt-2 max-w-2xl text-sm lg:text-base">
                Envie o seu vídeo de criação, informe seu usuário do Instagram e deixe nossa inteligência artificial criar ganchos poderosos, hashtags virais e textos persuasivos em segundos.
              </p>
            </div>

            {/* Input Form Column */}
            <div className="lg:col-span-5 w-full min-w-0">
              <div className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden glow-instagram w-full min-w-0">
                <form onSubmit={handleGenerateCaption} className="space-y-6">
                  
                  {/* Instagram Username Field */}
                  <div className="space-y-2">
                    <label htmlFor="user_insta" className="block text-xs font-semibold uppercase tracking-wider text-[#E1306C]">
                      @ Seu Instagram
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-medium">
                        @
                      </div>
                      <input
                        id="user_insta"
                        type="text"
                        required
                        placeholder="seu.usuario"
                        value={username.startsWith("@") ? username.slice(1) : username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#030014]/50 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C]/70 focus:ring-1 focus:ring-[#E1306C]/30 transition-all font-medium text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Este @ será inserido automaticamente na estrutura final da sua legenda.
                    </p>
                  </div>

                  {/* Video File Uploader */}
                  <div className="space-y-2 w-full min-w-0">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1306C]">
                      Upload do Vídeo do Post
                    </label>
                    
                    {videoFile ? (
                      /* Active Video State: Fully responsive card with a high-end video preview player */
                      <div className="border border-[#E1306C]/25 bg-[#030014]/50 rounded-xl p-3 sm:p-4 space-y-4 glow-instagram w-full min-w-0 overflow-hidden">
                        
                        {/* Video Player Preview */}
                        {videoPreviewUrl && (
                          <div className="rounded-lg overflow-hidden border border-white/5 bg-black/60 relative aspect-video w-full">
                            <video
                              src={videoPreviewUrl}
                              controls
                              playsInline
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                        {/* File Details */}
                        <div className="flex items-center gap-3 bg-white/5 p-2.5 sm:p-3 rounded-lg border border-white/5 w-full min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            <FileVideo className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-xs font-semibold text-white truncate pr-1 w-full">
                              {videoFile.name}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                              {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        {/* Control Buttons (Stacked vertically on mobile, horizontal on tablet/desktop) */}
                        <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => {
                              document.getElementById("hidden_video_input")?.click();
                            }}
                            className="flex-1 py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider transition-all text-center"
                          >
                            Alterar Vídeo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoFile(null);
                              setVideoPreviewUrl(null);
                            }}
                            className="py-2.5 px-3 rounded-lg bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 text-red-400 text-[11px] font-bold uppercase tracking-wider transition-all"
                          >
                            Remover
                          </button>
                        </div>

                        {/* Hidden input to trigger alternative select */}
                        <input
                          id="hidden_video_input"
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      /* Empty Upload State: Dashed dropzone */
                      <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={`border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer text-center relative flex flex-col items-center justify-center min-h-[170px] w-full min-w-0 overflow-hidden ${
                          isDragOver 
                            ? "border-[#E1306C] bg-[#E1306C]/5 glow-instagram" 
                            : "border-white/10 bg-[#030014]/30 hover:border-white/20"
                        }`}
                      >
                        <input
                          id="video_upload"
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="space-y-3 text-center w-full">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-400">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="w-full">
                            <p className="text-xs font-medium text-white px-2">
                              Arraste seu vídeo aqui ou <span className="text-[#E1306C] underline decoration-[#E1306C]/40 hover:opacity-80">navegue</span>
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1 px-2">
                              MP4, MOV ou qualquer formato de vídeo (Máx. 50MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Context (AI Guidance) */}
                  <div className="space-y-2">
                    <label htmlFor="context_input" className="block text-xs font-semibold uppercase tracking-wider text-[#E1306C]">
                      Contexto ou Niche (Opcional)
                    </label>
                    <textarea
                      id="context_input"
                      rows={3}
                      placeholder="Ex: Meme sobre o cansaço de programadores na sexta-feira à noite, oferecendo dicas de foco com IA no final do post..."
                      value={videoContext}
                      onChange={(e) => setVideoContext(e.target.value)}
                      className="w-full bg-[#030014]/50 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C]/70 focus:ring-1 focus:ring-[#E1306C]/30 transition-all text-sm resize-none"
                    />
                    <p className="text-[10px] text-gray-500">
                      Adicione ganchos específicos ou informações extras para guiar a IA e obter uma resposta muito mais personalizada.
                    </p>
                  </div>

                  {/* Generate Button */}
                  <button
                    id="btn_submit_generation"
                    type="submit"
                    disabled={loading || !username}
                    className="w-full py-4 rounded-xl bg-instagram-gradient hover:opacity-95 font-bold text-sm tracking-wider uppercase text-white shadow-lg shadow-pink-500/15 hover:shadow-pink-500/25 focus:outline-none transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Escrevendo Legenda...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Gerar Legenda com IA
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* AI Response Output Column */}
            <div className="lg:col-span-7 flex flex-col justify-start">
              
              {/* If loading show interactive loader */}
              {loading && (
                <div className="glass-card rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[350px] border border-[#E1306C]/25 glow-instagram">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-[#E1306C]/20" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-[#E1306C] animate-spin" />
                    <div className="absolute inset-4 rounded-full bg-instagram-gradient opacity-20 animate-pulse" />
                    <div className="absolute inset-4 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-[#E1306C]" />
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white tracking-tight">
                    DARK IA no Comando
                  </h3>
                  <p className="text-gray-400 text-sm mt-2 font-mono h-6 text-[#E1306C]/90">
                    {loadingStep}
                  </p>
                  <p className="text-xs text-gray-500 max-w-sm mt-4">
                    Estamos criando uma legenda exclusiva aplicando técnicas de neuro-copywriting para prender a atenção do público.
                  </p>
                </div>
              )}

              {/* Static Empty State or Prompt to Generate */}
              {!loading && !generatedCaption && (
                <div className="glass-card rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[350px] border border-white/5">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4 text-gray-400">
                    <Video className="w-8 h-8 text-[#E1306C]" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Sua Legenda Aparecerá Aqui
                  </h3>
                  <p className="text-gray-400 text-xs max-w-sm mt-2 leading-relaxed">
                    Preencha os dados à esquerda, insira o seu @ do Instagram e clique em gerar. Nossa IA entregará cópias irresistíveis prontas para colar e bombar.
                  </p>
                </div>
              )}

              {/* Caption Display Block */}
              {generatedCaption && !loading && (
                <motion.div
                  id="caption_result_block"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-2xl p-6 lg:p-8 h-full flex flex-col border border-[#E1306C]/35 glow-instagram"
                >
                  
                  {/* Output Header Controls */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                    <div>
                      <h3 className="font-display font-bold text-white text-base">
                        Legenda Gerada com Sucesso
                      </h3>
                      <p className="text-[10px] text-[#E1306C] uppercase tracking-widest font-semibold mt-0.5">
                        Copywriting Validado 🔥
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        id="btn_toggle_edit_caption"
                        onClick={() => {
                          if (isEditingCaption) {
                            // Cancel edit
                            setEditedCaption(generatedCaption);
                          }
                          setIsEditingCaption(!isEditingCaption);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-all flex items-center gap-1.5"
                      >
                        {isEditingCaption ? "Cancelar" : "Editar Texto"}
                      </button>
                    </div>
                  </div>

                  {/* Smart Contingency Notification Banner */}
                  {isSimulated && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-xl bg-[#E1306C]/10 border border-[#E1306C]/30 text-white text-xs flex items-start gap-2.5 glow-instagram"
                    >
                      <Sparkles className="w-4 h-4 text-[#E1306C] shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="font-bold text-white text-[11px] uppercase tracking-wider">
                          Redundância de IA Inteligente Ativada
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                          {simulatedMessage || "O servidor principal está com tráfego elevado. Nosso motor de contingência de Copywriting Premium gerou esta cópia otimizada."}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Body Text Area */}
                  <div className="flex-1 min-h-[220px]">
                    {isEditingCaption ? (
                      <textarea
                        id="caption_editor"
                        rows={10}
                        value={editedCaption}
                        onChange={(e) => setEditedCaption(e.target.value)}
                        className="w-full h-full bg-[#030014]/65 border border-[#E1306C]/30 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#E1306C] transition-all font-sans leading-relaxed"
                      />
                    ) : (
                      <div className="bg-[#030014]/40 border border-white/5 rounded-xl p-5 text-gray-200 text-sm whitespace-pre-wrap font-sans leading-relaxed h-full overflow-y-auto max-h-[380px]">
                        {generatedCaption}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    
                    {/* Copy Button */}
                    <button
                      id="btn_copy_caption"
                      onClick={handleCopyCaption}
                      className="py-3 px-4 rounded-xl bg-white text-black hover:bg-gray-100 font-bold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-white/5 active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-black" />
                          Copiar Legenda
                        </>
                      )}
                    </button>

                    {/* Regenerate Button */}
                    <button
                      id="btn_regenerate"
                      onClick={handleGenerateCaption}
                      className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Gerar Nova Versão
                    </button>

                  </div>

                </motion.div>
              )}

            </div>



          </motion.div>
        )}

        {/* TAB 2: Profile Picture Icons Library */}
        {activeTab === "profile-icons" && (
          <motion.div
            id="view_profile_icons"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8 lg:space-y-12"
          >
            {/* Library Header */}
            <div className="text-center">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#C13584]/15 to-[#FCAF45]/15 border border-[#E1306C]/30 text-xs font-semibold text-[#E1306C] uppercase tracking-widest">
                Biblioteca Premium
              </span>
              <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-white mt-3">
                Fotos de Perfil <span className="text-instagram-gradient">Ultra Estilizadas</span>
              </h1>
              <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-sm lg:text-base">
                Eleve o nível visual do seu perfil do Instagram com nossa biblioteca exclusiva de ícones futuristas, 3D e tecnológicos prontos para download.
              </p>
            </div>

            {/* Filter and Search Bar Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 glow-instagram">
              
              {/* Category Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-instagram-gradient text-white shadow-md shadow-pink-500/15"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-80">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="search_library"
                  type="text"
                  placeholder="Buscar ícone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#030014]/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#E1306C]/70 focus:ring-1 focus:ring-[#E1306C]/30 transition-all text-xs"
                />
              </div>

            </div>

            {/* Library Grid */}
            {filteredIcons.length === 0 ? (
              <div className="text-center py-20 bg-white/5 border border-white/5 rounded-2xl">
                <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-bold font-display text-lg">Nenhum ícone disponível</h3>
                <p className="text-gray-400 text-xs mt-1">Nenhum item foi encontrado nesta categoria ou busca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                {filteredIcons.map((icon) => (
                  <motion.div
                    key={icon.id}
                    layoutId={`icon-card-${icon.id}`}
                    onClick={() => setSelectedIcon(icon)}
                    className="glass-card rounded-2xl overflow-hidden cursor-pointer group border border-white/5 hover:border-[#E1306C]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col glow-instagram"
                  >
                    
                    {/* Visual Container */}
                    <div className="aspect-square w-full bg-[#030014] flex flex-col items-center justify-center relative border-b border-white/5 p-6 md:p-8 select-none">
                      
                      {/* Instagram Story Gradient Ring */}
                      <div className="relative w-4/5 aspect-square rounded-full p-[3px] bg-instagram-gradient shadow-lg group-hover:scale-105 transition-all duration-500 flex items-center justify-center">
                        {/* Gap/inner border */}
                        <div className="w-full h-full rounded-full bg-[#030014] p-[3px] flex items-center justify-center">
                          {/* Inner Image */}
                          <img
                            src={`/uploads/${icon.filename}`}
                            alt={icon.title}
                            className="w-full h-full rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      
                      {/* Gradient Hover Cover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4 rounded-t-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#E1306C] bg-[#E1306C]/10 px-2.5 py-1 rounded-full border border-[#E1306C]/20 backdrop-blur-sm">
                          Ver Detalhes
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Category Tag */}
                      <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider text-white bg-[#030014]/80 border border-white/10 backdrop-blur-md px-2.5 py-1 rounded-full">
                        {icon.category}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-bold text-white text-sm truncate text-center">
                          {icon.title}
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-0.5 text-center">
                          Adicionado em {new Date(icon.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      
                      {/* Download Action Trigger */}
                      <button
                        id={`btn_download_fast_${icon.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadIcon(icon);
                        }}
                        className="w-full mt-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar
                      </button>
                    </div>

                  </motion.div>
                ))}
              </div>
            )}

            {/* Picture Zoom Modal Popup */}
            <AnimatePresence>
              {selectedIcon && (
                <div id="modal_zoom_picture" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  
                  {/* Backdrop Cover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.85 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedIcon(null)}
                    className="absolute inset-0 bg-black"
                  />

                  {/* Modal Container */}
                  <motion.div
                    layoutId={`icon-card-${selectedIcon.id}`}
                    className="glass-card rounded-2xl overflow-hidden w-full max-w-lg border border-[#E1306C]/30 glow-instagram relative z-10 flex flex-col"
                  >
                    {/* Close Button */}
                    <button
                      id="btn_close_zoom"
                      onClick={() => setSelectedIcon(null)}
                      className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/95 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Image Area */}
                    <div className="aspect-square w-full bg-[#030014] flex flex-col items-center justify-center relative p-8 border-b border-white/5">
                      
                      {/* Big Instagram Story Ring */}
                      <div className="relative w-2/3 aspect-square rounded-full p-[4px] bg-instagram-gradient shadow-2xl shadow-pink-500/10 flex items-center justify-center">
                        {/* Gap */}
                        <div className="w-full h-full rounded-full bg-[#030014] p-[4px] flex items-center justify-center">
                          {/* Inner Image */}
                          <img
                            src={`/uploads/${selectedIcon.filename}`}
                            alt={selectedIcon.title}
                            className="w-full h-full rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#E1306C] bg-[#E1306C]/10 px-2.5 py-1 rounded-full border border-[#E1306C]/20">
                          {selectedIcon.category}
                        </span>
                        <h2 className="font-display text-xl font-bold text-white tracking-tight mt-2">
                          {selectedIcon.title}
                        </h2>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="p-6 bg-[#030014]/90 border-t border-white/5 flex items-center justify-between gap-4">
                      <p className="text-xs text-gray-500">
                        Clique para salvar a imagem em alta definição e utilizá-la em suas redes sociais.
                      </p>
                      <button
                        id="btn_download_modal"
                        onClick={() => handleDownloadIcon(selectedIcon)}
                        className="py-3 px-6 rounded-xl bg-instagram-gradient hover:opacity-95 font-bold text-xs tracking-wider uppercase text-white shadow-lg shadow-pink-500/15 whitespace-nowrap flex items-center gap-2 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Salvar Ícone
                      </button>
                    </div>

                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* TAB 3: ADMIN ZONE */}
        {activeTab === "admin" && (
          <motion.div
            id="view_admin_panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8 lg:space-y-12"
          >
            
            {/* If not logged in show glowing login screen */}
            {!adminSession ? (
              <div className="max-w-md mx-auto py-12">
                <div className="glass-card rounded-2xl p-6 lg:p-8 border border-[#E1306C]/25 glow-instagram">
                  
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/25 flex items-center justify-center mx-auto text-[#E1306C] mb-3 glow-instagram">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                      Acesso Restrito
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Faça login com suas credenciais de administrador.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    
                    {/* Error Alerts */}
                    {adminError && (
                      <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{adminError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="admin_user" className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Usuário Administrador
                      </label>
                      <input
                        id="admin_user"
                        type="text"
                        required
                        placeholder="usuario"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full bg-[#030014]/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E1306C]/70 focus:ring-1 focus:ring-[#E1306C]/30 transition-all text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="admin_pass" className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Senha Secreta
                      </label>
                      <input
                        id="admin_pass"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-[#030014]/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#E1306C]/70 focus:ring-1 focus:ring-[#E1306C]/30 transition-all text-sm font-medium"
                      />
                    </div>

                    <button
                      id="btn_submit_login"
                      type="submit"
                      className="w-full mt-6 py-3.5 rounded-xl bg-instagram-gradient hover:opacity-95 font-bold text-xs tracking-wider uppercase text-white shadow-lg shadow-pink-500/15 focus:outline-none transition-all duration-300"
                    >
                      Autenticar Administrador
                    </button>
                  </form>

                </div>
              </div>
            ) : (

              /* Admin Dashboard UI */
              <div className="space-y-8 w-full min-w-0 overflow-hidden">
                
                {/* Dashboard Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 w-full min-w-0">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/25 text-[10px] font-semibold text-[#E1306C] uppercase tracking-widest">
                      Administração
                    </span>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mt-3 truncate w-full">
                      Painel Administrativo
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed">
                      Gerencie a biblioteca de fotos de perfil, categorias e visibilidade pública para os clientes.
                    </p>
                  </div>

                  <button
                    id="btn_logout_dashboard"
                    onClick={handleAdminLogout}
                    className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair do Admin
                  </button>
                </div>

                {/* Grid controls */}
                <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 w-full min-w-0">
                  
                  {/* Left Column: Image Upload Form */}
                  <div className="lg:col-span-4 w-full min-w-0">
                    <div className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#E1306C]/20 glow-instagram w-full min-w-0">
                      <h2 className="font-display font-bold text-white text-lg mb-6 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-[#E1306C]" />
                        Novo Upload
                      </h2>

                      <form onSubmit={handleImageUpload} className="space-y-5">
                        
                        {/* Title input */}
                        <div className="space-y-1.5">
                          <label htmlFor="upload_title" className="block text-[10px] font-semibold uppercase tracking-wider text-[#E1306C]">
                            Título da Imagem
                          </label>
                          <input
                            id="upload_title"
                            type="text"
                            required
                            placeholder="Ex: Cyberpunk Neon Samurai"
                            value={newImageTitle}
                            onChange={(e) => setNewImageTitle(e.target.value)}
                            className="w-full bg-[#030014]/50 border border-white/10 rounded-xl py-2.5 px-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#E1306C]/70 focus:ring-1 focus:ring-[#E1306C]/30 transition-all text-xs"
                          />
                        </div>

                        {/* Category selection */}
                        <div className="space-y-1.5">
                          <label htmlFor="upload_category" className="block text-[10px] font-semibold uppercase tracking-wider text-[#E1306C]">
                            Categoria
                          </label>
                          <select
                            id="upload_category"
                            value={newImageCategory}
                            onChange={(e) => setNewImageCategory(e.target.value)}
                            className="w-full bg-[#030014]/50 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-[#E1306C]/70 transition-all text-xs"
                          >
                            <option value="Cyberpunk">Cyberpunk</option>
                            <option value="Minimalista">Minimalista</option>
                            <option value="IA">Inteligência Artificial (IA)</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </div>

                        {/* Image file selector */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#E1306C]">
                            Arquivo de Foto
                          </label>

                          <div
                            onDragOver={onAdminDragOver}
                            onDragLeave={onAdminDragLeave}
                            onDrop={onAdminDrop}
                            className={`border border-dashed rounded-xl p-4 cursor-pointer text-center relative flex flex-col items-center justify-center min-h-[140px] transition-all w-full min-w-0 overflow-hidden ${
                              isAdminDragOver
                                ? "border-[#E1306C] bg-[#E1306C]/5 glow-instagram"
                                : "border-white/10 bg-[#030014]/30 hover:border-white/20"
                            }`}
                          >
                            <input
                              id="admin_image_upload"
                              type="file"
                              accept="image/*"
                              required
                              onChange={handleAdminImageChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />

                            {newImagePreview ? (
                              <div className="z-10 text-center space-y-2 w-full">
                                <img
                                  src={newImagePreview}
                                  alt="Preview"
                                  className="w-16 h-16 rounded-xl object-cover mx-auto border border-[#E1306C]/50"
                                  referrerPolicy="no-referrer"
                                />
                                <p className="text-[10px] text-gray-400 truncate max-w-[200px] mx-auto px-2 w-full">
                                  {newImageFile ? newImageFile.name : "imagem.jpg"}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2 text-center w-full">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-400">
                                  <Upload className="w-4 h-4" />
                                </div>
                                <p className="text-[10px] text-gray-400 px-2">
                                  Arraste a foto ou clique para escolher
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Visibility Status Toggle */}
                        <div className="flex items-center justify-between gap-3 bg-[#030014]/50 border border-white/5 rounded-xl p-3.5 w-full min-w-0">
                          <div className="min-w-0 flex-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-white truncate">
                              Disponibilizar ao Público
                            </span>
                            <span className="block text-[9px] text-gray-500 mt-0.5 leading-relaxed">
                              Os clientes poderão ver e baixar esta foto imediatamente.
                            </span>
                          </div>
                          <button
                            id="btn_toggle_upload_visibility"
                            type="button"
                            onClick={() => setNewImageIsPublic(!newImageIsPublic)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              newImageIsPublic ? "bg-instagram-gradient" : "bg-zinc-800"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                newImageIsPublic ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Submit Button */}
                        <button
                          id="btn_submit_upload"
                          type="submit"
                          disabled={uploadProgress || !newImagePreview || !newImageTitle}
                          className="w-full mt-4 py-3 rounded-xl bg-instagram-gradient hover:opacity-95 font-bold text-xs tracking-wider uppercase text-white shadow-lg shadow-pink-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                          {uploadProgress ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Enviando foto...
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Cadastrar Nova Imagem
                            </>
                          )}
                        </button>

                      </form>

                    </div>
                  </div>

                  {/* Right Column: Registered Images Table/Grid */}
                  <div className="lg:col-span-8 space-y-4 w-full min-w-0">
                    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/5 w-full min-w-0">
                      <h2 className="font-display font-bold text-white text-lg mb-6 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#E1306C]" />
                        Imagens Cadastradas ({adminImages.length})
                      </h2>

                      {adminImages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-xs">
                          Nenhuma foto cadastrada no banco de dados. Utilize o formulário ao lado para cadastrar.
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1 w-full min-w-0">
                          {adminImages.map((img) => (
                            <div
                               key={img.id}
                               className="bg-[#030014]/60 border border-white/5 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 hover:border-[#E1306C]/25 transition-all w-full min-w-0 overflow-hidden"
                            >
                              {/* Left detail */}
                              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <div className="w-12 h-12 rounded-full p-[1.5px] bg-instagram-gradient shrink-0 flex items-center justify-center shadow-md">
                                  <div className="w-full h-full rounded-full bg-[#030014] p-[1.5px] flex items-center justify-center">
                                    <img
                                      src={`/uploads/${img.filename}`}
                                      alt={img.title}
                                      className="w-full h-full rounded-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-display font-bold text-white text-sm truncate w-full pr-1">
                                    {img.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold uppercase text-[#E1306C] bg-[#E1306C]/10 px-2 py-0.5 rounded border border-[#E1306C]/10 shrink-0">
                                      {img.category}
                                    </span>
                                    <span className="text-[9px] text-gray-500 shrink-0">
                                      {new Date(img.createdAt).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Controls */}
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                
                                {/* Toggle visibility */}
                                <button
                                  id={`btn_toggle_visibility_${img.id}`}
                                  onClick={() => handleTogglePublic(img.id)}
                                  className={`p-2 rounded-lg border transition-all ${
                                    img.isPublic
                                      ? "border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/15"
                                      : "border-zinc-500/20 bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/15"
                                  }`}
                                  title={img.isPublic ? "Ativo (Público)" : "Oculto (Privado)"}
                                >
                                  {img.isPublic ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </button>

                                {/* Delete image */}
                                <button
                                  id={`btn_delete_img_${img.id}`}
                                  onClick={() => handleDeleteImage(img.id)}
                                  className="p-2 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition-all"
                                  title="Excluir Imagem"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>

                </div>

              </div>
            )}

          </motion.div>
        )}

      </main>

      {/* Footer */}
      <footer id="main_footer" className="bg-[#030014]/45 border-t border-white/5 px-4 lg:px-8 py-8 mt-16 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © 2026 DARK IA. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => { setActiveTab("caption-generator"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="hover:text-white transition-all"
            >
              Gerador de Legendas
            </button>
            <button
              onClick={() => { setActiveTab("profile-icons"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="hover:text-white transition-all"
            >
              Biblioteca de Ícones
            </button>
            <button
              onClick={() => { setActiveTab("admin"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="hover:text-white transition-all flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Administrador
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
