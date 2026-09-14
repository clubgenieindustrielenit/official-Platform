'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ArrowLeft, ImagePlus, Plus, ZoomIn, ZoomOut,
  Loader2, Calendar, MapPin, AlignLeft, Tag, LayoutGrid,
  CheckCircle2
} from 'lucide-react'
import { compressImage } from '@/lib/utils/imageCompressor'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostCreatorProps {
  isOpen: boolean
  onClose: () => void
  /** Called with FormData ready to POST/PUT to /api/admin/activities */
  onSave: (fd: FormData) => Promise<void>
  /** Pass an existing activity to edit; null = create */
  editingActivity?: {
    id: string
    title: string
    description: string
    content?: string
    category: string
    date: string
    location?: string
    status: string
    photo_urls?: string[]
    image_url?: string
  } | null
}

const CATEGORIES = ['Workshop', 'Hackathon', 'Conférence', 'Autre']

// ─── Drag-and-drop helpers ────────────────────────────────────────────────────

function useFileDrop(onFiles: (files: File[]) => void) {
  const [dragging, setDragging] = useState(false)
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) onFiles(files)
  }
  return { dragging, onDragOver, onDragLeave, onDrop }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PostCreatorModal({ isOpen, onClose, onSave, editingActivity }: PostCreatorProps) {
  // ── STEP state: 1 = pick, 2 = crop/arrange, 3 = details ──
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // ── Photo state ──
  const [files, setFiles] = useState<File[]>([])          // new local files
  const [existingUrls, setExistingUrls] = useState<string[]>([]) // already-uploaded URLs
  const [activeIdx, setActiveIdx] = useState(0)           // which photo is previewed
  const [zoom, setZoom] = useState(1)

  // ── Details form ──
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Workshop')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<'published' | 'draft'>('published')

  // ── Save state ──
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMoreRef = useRef<HTMLInputElement>(null)

  // ── Prefill when editing ──
  useEffect(() => {
    if (!isOpen) return
    setSaved(false)
    setSaving(false)

    if (editingActivity) {
      setTitle(editingActivity.title)
      setDescription(editingActivity.description)
      setContent(editingActivity.content || '')
      setCategory(editingActivity.category)
      setDate(editingActivity.date ? new Date(editingActivity.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
      setLocation(editingActivity.location || '')
      setStatus(editingActivity.status as 'published' | 'draft')
      const urls = editingActivity.photo_urls?.length
        ? editingActivity.photo_urls
        : editingActivity.image_url
        ? [editingActivity.image_url]
        : []
      setExistingUrls(urls)
      setFiles([])
      setActiveIdx(0)
      setZoom(1)
      // Jump straight to step 2 (arrange) if already has photos, else 3 (details)
      setStep(urls.length > 0 ? 2 : 3)
    } else {
      setTitle(''); setDescription(''); setContent(''); setCategory('Workshop')
      setDate(new Date().toISOString().slice(0, 10)); setLocation(''); setStatus('published')
      setExistingUrls([]); setFiles([]); setActiveIdx(0); setZoom(1)
      setStep(1)
    }
  }, [isOpen, editingActivity])

  // ── All preview items (existing urls + new files) ──
  const allItems: { type: 'url' | 'file'; src: string; index: number }[] = [
    ...existingUrls.map((url, i) => ({ type: 'url' as const, src: url, index: i })),
    ...files.map((f, i) => ({ type: 'file' as const, src: URL.createObjectURL(f), index: i })),
  ]
  const totalCount = allItems.length

  const addFiles = useCallback((incoming: File[]) => {
    setFiles(prev => {
      const remaining = 10 - existingUrls.length - prev.length
      return [...prev, ...incoming.slice(0, remaining)]
    })
  }, [existingUrls.length])

  const removeItem = (item: typeof allItems[number]) => {
    if (item.type === 'url') {
      setExistingUrls(prev => prev.filter((_, i) => i !== item.index))
    } else {
      setFiles(prev => prev.filter((_, i) => i !== item.index))
    }
    setActiveIdx(0)
  }

  const { dragging, onDragOver, onDragLeave, onDrop } = useFileDrop((dropped) => {
    addFiles(dropped)
    if (step === 1) setStep(2)
  })

  const handlePickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const picked = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    addFiles(picked)
    setStep(2)
    e.target.value = ''
  }

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const picked = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    addFiles(picked)
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Veuillez remplir le Titre et la Description pour pouvoir publier.")
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      if (editingActivity) fd.append('id', editingActivity.id)
      fd.append('title', title.trim())
      fd.append('description', description.trim())
      fd.append('content', content.trim())
      fd.append('category', category)
      fd.append('date', new Date(date).toISOString())
      fd.append('location', location.trim())
      fd.append('status', status)
      fd.append('photo_urls', JSON.stringify(existingUrls))
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1280, 960, 0.82)
        fd.append(`file_${i}`, compressed)
      }
      await onSave(fd)
      setSaved(true)
      setTimeout(() => onClose(), 1200)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const activeItem = allItems[activeIdx] ?? null

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            width: step === 3 ? '860px' : '540px',
            maxWidth: '95vw',
            maxHeight: '90vh',
          }}
        >
          {/* ── HEADER ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2e2e2e] shrink-0">
            <div className="w-8">
              {step > 1 && (
                <button
                  onClick={() => setStep(step === 3 ? 2 : 1)}
                  className="text-white hover:text-[#fca311] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>

            <h2 className="text-sm font-bold text-white">
              {step === 1 ? 'Créer une publication' : step === 2 ? 'Rogner' : 'Nouvelle publication'}
            </h2>

            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  disabled={totalCount === 0}
                  className="text-xs font-bold text-[#fca311] hover:text-white transition-colors disabled:opacity-40"
                >
                  Suivant
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    !title.trim() || !description.trim()
                      ? 'text-[#fca311]/60 hover:text-[#fca311]'
                      : 'text-[#fca311] hover:text-white'
                  }`}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  {saved ? 'Publié !' : editingActivity ? 'Modifier' : 'Partager'}
                </button>
              )}
              <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── STEP 1: PICK / DROP ── */}
          {step === 1 && (
            <div
              className={`flex flex-col items-center justify-center gap-6 p-12 transition-colors ${
                dragging ? 'bg-[#fca311]/5 border-2 border-dashed border-[#fca311]/50' : ''
              }`}
              style={{ minHeight: '360px' }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#252525] border border-[#333] flex items-center justify-center">
                  <ImagePlus className={`w-9 h-9 ${dragging ? 'text-[#fca311]' : 'text-[#555]'}`} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-white font-semibold text-base">
                    {dragging ? 'Relâche pour ajouter' : 'Fais glisser les photos ici'}
                  </p>
                  <p className="text-[#666] text-xs">Formats acceptés : JPG, PNG, WEBP · Max 10 photos</p>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 rounded-xl bg-[#fca311] hover:bg-[#ffc95e] text-black font-bold text-sm transition-all shadow-lg shadow-[#fca311]/20"
              >
                Sélectionner sur l'ordinateur
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePickFiles}
              />
            </div>
          )}

          {/* ── STEP 2: CROP / ARRANGE ── */}
          {step === 2 && (
            <div className="flex flex-col" style={{ minHeight: '480px' }}>
              {/* Main preview */}
              <div className="relative bg-black flex-1 flex items-center justify-center overflow-hidden" style={{ minHeight: '400px' }}>
                {activeItem ? (
                  <img
                    src={activeItem.src}
                    alt="preview"
                    className="object-contain transition-transform duration-200"
                    style={{
                      maxHeight: '400px',
                      maxWidth: '100%',
                      transform: `scale(${zoom})`,
                    }}
                  />
                ) : (
                  <div className="text-[#555] text-sm">Aucune image sélectionnée</div>
                )}

                {/* Zoom controls */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
                  <button
                    onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(1)))}
                    className="text-white hover:text-[#fca311] transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-white text-xs font-mono w-8 text-center">{(zoom * 100).toFixed(0)}%</span>
                  <button
                    onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))}
                    className="text-white hover:text-[#fca311] transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Aspect indicator */}
                <div className="absolute bottom-4 right-4 bg-black/60 rounded-full px-3 py-1.5 backdrop-blur-sm flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-mono">{totalCount}/10</span>
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="border-t border-[#2e2e2e] px-4 py-3 bg-[#161616] flex items-center gap-2 overflow-x-auto shrink-0">
                {allItems.map((item, idx) => (
                  <div key={`${item.type}-${item.index}`} className="relative group shrink-0">
                    <button
                      onClick={() => { setActiveIdx(idx); setZoom(1) }}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        activeIdx === idx ? 'border-[#fca311] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={item.src} alt="" className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => removeItem(item)}
                      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-black border border-[#444] text-white hidden group-hover:flex items-center justify-center text-[10px] font-bold hover:bg-red-600 transition-colors"
                      style={{ width: '18px', height: '18px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                {totalCount < 10 && (
                  <button
                    onClick={() => addMoreRef.current?.click()}
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-[#444] hover:border-[#fca311] flex flex-col items-center justify-center shrink-0 text-[#555] hover:text-[#fca311] transition-colors bg-[#1e1e1e]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
                <input
                  ref={addMoreRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddMore}
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: DETAILS ── */}
          {step === 3 && (
            <div className="flex flex-1 overflow-hidden" style={{ minHeight: '500px' }}>
              {/* Left: Photo preview */}
              <div className="w-[420px] bg-black flex items-center justify-center shrink-0 relative overflow-hidden">
                {allItems.length > 0 ? (
                  <>
                    <img
                      src={allItems[activeIdx]?.src ?? allItems[0]?.src}
                      alt="preview"
                      className="w-full h-full object-contain"
                      style={{ maxHeight: '500px' }}
                    />
                    {/* Mini thumbnail nav if multiple */}
                    {allItems.length > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {allItems.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveIdx(idx)}
                            className={`rounded-full transition-all ${
                              activeIdx === idx
                                ? 'w-2 h-2 bg-white'
                                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-[#444] text-sm flex flex-col items-center gap-2">
                    <ImagePlus className="w-10 h-10" />
                    <span>Aucune image</span>
                  </div>
                )}
              </div>

              {/* Right: Form */}
              <div className="flex-1 overflow-y-auto border-l border-[#2e2e2e]">
                {/* Club identity badge */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2e2e2e]">
                  <div className="w-9 h-9 rounded-full bg-[#fca311]/10 border border-[#fca311]/30 flex items-center justify-center text-[#fca311] font-bold text-xs shrink-0">
                    GI
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-none">Club GI ENIT</p>
                    <p className="text-[#555] text-[10px] mt-0.5">Publication officielle</p>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-5">
                  {/* Title */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                      <AlignLeft className="w-3 h-3" /> Titre *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="ex: Hackathon IA — ENIT 2026"
                      className="w-full bg-transparent border-b border-[#333] focus:border-[#fca311] outline-none text-white text-sm py-1.5 placeholder-[#444] transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                      <AlignLeft className="w-3 h-3" /> Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Résumé de l'activité affiché sur les cartes..."
                      className="w-full bg-transparent border-b border-[#333] focus:border-[#fca311] outline-none text-white text-sm py-1.5 placeholder-[#444] transition-colors resize-none"
                    />
                    <span className="text-[10px] text-[#555] font-mono">{description.length}/500</span>
                  </div>

                  {/* Category chips */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#888] mb-2">
                      <Tag className="w-3 h-3" /> Catégorie
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            category === cat
                              ? 'bg-[#fca311] text-black border-[#fca311] shadow-sm'
                              : 'bg-[#1e1e1e] text-[#888] border-[#333] hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date & Location row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                        <Calendar className="w-3 h-3" /> Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-transparent border-b border-[#333] focus:border-[#fca311] outline-none text-white text-sm py-1.5 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                        <MapPin className="w-3 h-3" /> Lieu
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="ENIT, Tunis..."
                        className="w-full bg-transparent border-b border-[#333] focus:border-[#fca311] outline-none text-white text-sm py-1.5 placeholder-[#444] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Status toggle */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#888] block mb-2">
                      Statut de publication
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-[#161616] p-1 rounded-xl border border-[#2a2a2a]">
                      <button
                        type="button"
                        onClick={() => setStatus('published')}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          status === 'published'
                            ? 'bg-[#fca311] text-black shadow-sm'
                            : 'text-[#666] hover:text-white'
                        }`}
                      >
                        Publier
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus('draft')}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          status === 'draft'
                            ? 'bg-[#2a2a2a] text-white'
                            : 'text-[#666] hover:text-white'
                        }`}
                      >
                        Brouillon
                      </button>
                    </div>
                  </div>

                  {/* Optional extended content */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                      <AlignLeft className="w-3 h-3" /> Contenu complet (optionnel)
                    </label>
                    <textarea
                      rows={3}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Détails supplémentaires, programme, intervenants..."
                      className="w-full bg-transparent border-b border-[#333] focus:border-[#fca311] outline-none text-white text-sm py-1.5 placeholder-[#444] transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Bottom submit bar */}
                <div className="sticky bottom-0 px-5 py-4 border-t border-[#2e2e2e] bg-[#1a1a1a]">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 rounded-xl bg-[#fca311] hover:bg-[#ffc95e] text-black font-extrabold text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#fca311]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                    ) : saved ? (
                      <><CheckCircle2 className="w-4 h-4" /> Publié avec succès !</>
                    ) : (
                      editingActivity ? 'Enregistrer les modifications' : 'Partager la publication'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
