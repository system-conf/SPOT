"use client";
import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Copy, Check, Edit2, Save, X } from "lucide-react";

type Template = {
    id: number;
    name: string;
    title: string;
    body: string;
    icon: string;
    variables: string[];
    createdAt: string;
    updatedAt: string;
};

type Variable = {
    name: string;
    example: string;
};

export default function TemplateManager() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        title: "",
        body: "",
        icon: "📢",
        variables: [] as Variable[]
    });

    const fetchTemplates = async () => {
        const res = await fetch("/api/templates");
        const data = await res.json();
        setTemplates(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            title: "",
            body: "",
            icon: "📢",
            variables: []
        });
        setShowCreate(false);
        setEditingId(null);
    };

    const createTemplate = async () => {
        if (!formData.name.trim() || !formData.title.trim() || !formData.body.trim()) return;
        
        await fetch("/api/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: formData.name,
                title: formData.title,
                body: formData.body,
                icon: formData.icon,
                variables: formData.variables.map(v => ({
                    name: v.name,
                    description: v.example
                }))
            }),
        });
        resetForm();
        fetchTemplates();
    };

    const updateTemplate = async (id: number) => {
        if (!formData.name.trim() || !formData.title.trim() || !formData.body.trim()) return;
        
        await fetch("/api/templates", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id,
                name: formData.name,
                title: formData.title,
                body: formData.body,
                icon: formData.icon,
                variables: formData.variables.map(v => ({
                    name: v.name,
                    description: v.example
                }))
            }),
        });
        resetForm();
        fetchTemplates();
    };

    const deleteTemplate = async (id: number) => {
        if (!confirm("Bu şablonu silmek istediğinizden emin misiniz?")) return;
        await fetch("/api/templates", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        fetchTemplates();
    };

    const copyTemplate = (template: Template) => {
        const text = `Şablon: ${template.name}\nBaşlık: ${template.title}\nİçerik: ${template.body}\nDeğişkenler: ${template.variables.join(", ")}`;
        navigator.clipboard.writeText(text);
        setCopiedId(template.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const startEdit = (template: Template) => {
        setEditingId(template.id);
        setFormData({
            name: template.name,
            title: template.title,
            body: template.body,
            icon: template.icon,
            variables: template.variables.map(v => ({ name: v, example: "" }))
        });
        setShowCreate(true);
    };

    const addVariable = () => {
        setFormData(prev => ({
            ...prev,
            variables: [...prev.variables, { name: "", example: "" }]
        }));
    };

    const removeVariable = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variables: prev.variables.filter((_, i) => i !== index)
        }));
    };

    const updateVariable = (index: number, field: "name" | "example", value: string) => {
        setFormData(prev => ({
            ...prev,
            variables: prev.variables.map((v, i) => 
                i === index ? { ...v, [field]: value } : v
            )
        }));
    };

    const icons = ["📢", "🔔", "⚡", "📧", "💬", "🎉", "⚠️", "❌", "✅", "📊"];

    return (
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Şablonlar
                </h3>
                {!showCreate && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Şablon
                    </button>
                )}
            </div>

            {/* Create/Edit Form */}
            {showCreate && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">
                            {editingId ? "Şablon Düzenle" : "Yeni Şablon Oluştur"}
                        </h4>
                        <button
                            onClick={resetForm}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Şablon adı (ör: Hata Bildirimi)"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                        />

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Başlık (ör: {{message}})"
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                            />
                            <div className="flex gap-1">
                                {icons.map((icon) => (
                                    <button
                                        key={icon}
                                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                        className={`w-10 h-10 rounded-lg text-lg transition-all ${
                                            formData.icon === icon
                                                ? "bg-blue-600"
                                                : "bg-white/5 hover:bg-white/10"
                                        }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={formData.body}
                            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                            placeholder="İçerik (ör: Hata oluştu: {{error}})"
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                        />

                        {/* Variables */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Değişkenler</span>
                                <button
                                    onClick={addVariable}
                                    className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Ekle
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.variables.map((variable, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={variable.name}
                                            onChange={(e) => updateVariable(index, "name", e.target.value)}
                                            placeholder="Değişken adı (ör: message)"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                                        />
                                        <input
                                            type="text"
                                            value={variable.example}
                                            onChange={(e) => updateVariable(index, "example", e.target.value)}
                                            placeholder="Örnek değer"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                                        />
                                        <button
                                            onClick={() => removeVariable(index)}
                                            className="px-2 py-1 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={editingId ? () => updateTemplate(editingId) : createTemplate}
                                disabled={!formData.name.trim() || !formData.title.trim() || !formData.body.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1"
                            >
                                <Save className="w-4 h-4" />
                                {editingId ? "Kaydet" : "Oluştur"}
                            </button>
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template List */}
            <div className="space-y-2">
                {loading ? (
                    <p className="text-gray-500 text-sm text-center py-4">Yükleniyor...</p>
                ) : templates.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">Henüz şablon yok.</p>
                ) : (
                    templates.map((template) => (
                        <div
                            key={template.id}
                            className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{template.icon}</span>
                                    <div>
                                        <span className="font-medium">{template.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {new Date(template.updatedAt).toLocaleDateString("tr-TR")}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => copyTemplate(template)}
                                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {copiedId === template.id ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => startEdit(template)}
                                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteTemplate(template.id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="mb-2">
                                <p className="text-sm text-blue-400">{template.title}</p>
                                <p className="text-sm text-gray-300 mt-1">{template.body}</p>
                            </div>
                            {template.variables.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {template.variables.map((variable) => (
                                        <span
                                            key={variable}
                                            className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400 font-mono"
                                        >
                                            {`{{${variable}}}`}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
