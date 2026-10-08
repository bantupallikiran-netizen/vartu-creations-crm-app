import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { CrmDocument, StageType, Lead, Quotation } from '../types.ts';
import {
  X,
  Upload,
  Share2,
  Eye,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  Copy,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Mail,
  AlertCircle,
  FileCheck,
  FolderOpen,
  Film,
} from 'lucide-react';

interface StageAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: 'Lead' | 'Quotation';
  entity: Lead | Quotation;
}

export const StageAttachmentsModal: React.FC<StageAttachmentsModalProps> = ({
  isOpen,
  onClose,
  stage,
  entity,
}) => {
  const {
    documents,
    activityLogs,
    deleteDocument,
    shareDocument,
    addLeadAttachment,
    addQuotationAttachment,
    addDocument,
  } = useCrm();

  const isLead = stage === 'Lead';
  const leadEntity = isLead ? (entity as Lead) : null;
  const quotationEntity = !isLead ? (entity as Quotation) : null;

  const entityId = entity.id;
  const entityNumber = isLead ? leadEntity?.leadNumber : quotationEntity?.quotationNumber;
  const customerName = entity.customerName;
  const customerMobile = isLead ? leadEntity?.whatsapp || leadEntity?.mobile : quotationEntity?.customerMobile;
  const customerEmail = isLead ? leadEntity?.email : quotationEntity?.customerEmail;

  // Filter documents linked to this entity & stage
  const linkedDocuments = documents.filter(
    (d) => d.linkedEntityId === entityId || (d.stage === stage && d.linkedEntityNumber === entityNumber)
  );

  // Filter activity logs linked to this entity & stage
  const entityLogs = activityLogs.filter(
    (l) => l.entityId === entityId || (l.stage === stage && l.entityNumber === entityNumber)
  );

  // Active tab inside modal
  const [activeTab, setActiveTab] = useState<'attachments' | 'upload' | 'logs'>('attachments');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'pdf'>('all');

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<CrmDocument | null>(null);

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState(
    isLead ? 'Reference Photo' : '3D Render / Mockup'
  );
  const [uploadFileType, setUploadFileType] = useState<CrmDocument['fileType']>('image');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadSize, setUploadSize] = useState('1.5 MB');
  const [uploadNotes, setUploadNotes] = useState('');
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Preset sample media for easy 1-click test
  const studioPresets = isLead
    ? [
        {
          name: 'Resin_Ocean_Geode_Video_Showcase.mp4',
          fileType: 'video' as const,
          category: 'Product Sample Video',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-glitter-suspended-in-liquid-40842-large.mp4',
          size: '6.4 MB',
          notes: 'Studio recording showing high gloss, metallic pigment swirl & depth under lighting.',
        },
        {
          name: 'Artisan_Gold_Calligraphy_Rakhi_Photo.jpg',
          fileType: 'image' as const,
          category: 'Reference Photo',
          url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
          size: '2.1 MB',
          notes: 'Customer custom monogram engraving with real 24k gold leaf foil.',
        },
        {
          name: 'Silk_Tassel_Color_Palette_Swatches.jpg',
          fileType: 'image' as const,
          category: 'Material Swatch',
          url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&auto=format&fit=crop&q=80',
          size: '1.8 MB',
          notes: 'Available thread colors: Royal Crimson, Golden Mustard, Peacock Blue.',
        },
      ]
    : [
        {
          name: 'Bespoke_Brass_Logo_Coin_3D_Render.jpg',
          fileType: 'image' as const,
          category: '3D Render / Mockup',
          url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=900&auto=format&fit=crop&q=80',
          size: '3.2 MB',
          notes: '3D visualization of corporate brass coin embedded in smoked grey epoxy.',
        },
        {
          name: 'Food_Grade_Resin_Safety_Spec_Sheet.pdf',
          fileType: 'pdf' as const,
          category: 'Technical Drawing / Spec Sheet',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          size: '890 KB',
          notes: 'ISO 9001 certified epoxy resin non-toxicity lab test certificate.',
        },
        {
          name: 'Live_Resin_Coaster_Water_Repel_Demo.mp4',
          fileType: 'video' as const,
          category: 'Product Sample Video',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-craftsman-polishing-a-wooden-piece-41484-large.mp4',
          size: '5.8 MB',
          notes: 'Waterproof test demonstration of cured resin teakwood coasters.',
        },
      ];

  const handleApplyPreset = (preset: typeof studioPresets[0]) => {
    setUploadName(preset.name);
    setUploadFileType(preset.fileType);
    setUploadCategory(preset.category);
    setUploadUrl(preset.url);
    setUploadSize(preset.size);
    setUploadNotes(preset.notes);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadSize(`${sizeInMb} MB`);

    if (file.type.startsWith('image/')) {
      setUploadFileType('image');
    } else if (file.type.startsWith('video/')) {
      setUploadFileType('video');
    } else if (file.type.includes('pdf')) {
      setUploadFileType('pdf');
    } else {
      setUploadFileType('document');
    }

    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const dataUrl = uploadEvt.target?.result as string;
      setUploadUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAttachment = (autoShareToWhatsApp = false) => {
    if (!uploadName.trim()) {
      alert('Please provide a file name or select an attachment.');
      return;
    }

    const finalUrl =
      uploadUrl ||
      (uploadFileType === 'image'
        ? 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80'
        : uploadFileType === 'video'
        ? 'https://assets.mixkit.co/videos/preview/mixkit-glitter-suspended-in-liquid-40842-large.mp4'
        : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

    const docPayload = {
      name: uploadName,
      fileType: uploadFileType,
      url: finalUrl,
      thumbnailUrl: uploadFileType === 'image' ? finalUrl : undefined,
      size: uploadSize,
      category: uploadCategory,
      notes: uploadNotes,
    };

    let resultDoc: CrmDocument;

    if (isLead) {
      const { doc } = addLeadAttachment(
        entityId,
        docPayload,
        autoShareToWhatsApp ? 'WhatsApp' : undefined
      );
      resultDoc = doc;
    } else {
      const { doc } = addQuotationAttachment(
        entityId,
        docPayload,
        autoShareToWhatsApp ? 'WhatsApp' : undefined
      );
      resultDoc = doc;
    }

    showToast(
      autoShareToWhatsApp
        ? `"${resultDoc.name}" stored in Documents and prepared for WhatsApp dispatch!`
        : `"${resultDoc.name}" stored in Documents repository & logged to ${stage} stage!`
    );

    if (autoShareToWhatsApp && customerMobile) {
      triggerWhatsAppShare(resultDoc);
    }

    // Reset upload form
    setUploadName('');
    setUploadUrl('');
    setUploadNotes('');
    setActiveTab('attachments');
  };

  const triggerWhatsAppShare = (doc: CrmDocument) => {
    const cleanPhone = (doc.customerMobile || customerMobile || '').replace(/\D/g, '');
    let msg = '';
    if (isLead) {
      msg = `Namaste ${customerName}! 🌸\nGreetings from Vartu Creations.\n\nWe have prepared the following attachment regarding your inquiry (${entityNumber || 'Lead'}):\n\n📎 *${doc.name}*\n📁 Category: ${doc.category}\n${doc.notes ? `📝 Note: ${doc.notes}\n` : ''}\nView online / download: ${doc.url}\n\nPlease let us know if you need any adjustments or custom color swatches!`;
    } else {
      msg = `Namaste ${customerName}! 🌸\nHere are the design proofs / specifications for your Quotation *${entityNumber || ''}* from Vartu Creations:\n\n📎 *${doc.name}*\n📁 Category: ${doc.category}\n${doc.notes ? `📝 Note: ${doc.notes}\n` : ''}\nView file: ${doc.url}\n\nWe would love to initiate craftsmanship once advance confirmation is received!`;
    }

    shareDocument(doc.id, 'WhatsApp', cleanPhone);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    showToast(`Shared "${doc.name}" via WhatsApp & recorded in activity log!`);
  };

  const triggerEmailShare = (doc: CrmDocument) => {
    const to = doc.customerEmail || customerEmail || '';
    const subject = `Vartu Creations - ${stage} Stage Attachment: ${doc.name} (${entityNumber || ''})`;
    const body = `Dear ${customerName},\n\nPlease find attached the ${doc.category} for your ${stage.toLowerCase()}:\n\nDocument: ${doc.name}\nNotes: ${doc.notes || 'None'}\nLink: ${doc.url}\n\nWarm regards,\nVartu Creations Handcrafted Resin Studio`;

    shareDocument(doc.id, 'Email', to);
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    showToast(`Opened email share for "${doc.name}" & recorded in log!`);
  };

  const handleCopyLink = (doc: CrmDocument) => {
    navigator.clipboard.writeText(doc.url);
    setCopiedDocId(doc.id);
    shareDocument(doc.id, 'Direct Link');
    showToast(`Media link copied to clipboard & logged!`);
    setTimeout(() => setCopiedDocId(null), 2500);
  };

  const filteredDocs = linkedDocuments.filter((d) => {
    if (filterType === 'all') return true;
    return d.fileType === filterType;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-4xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-800 text-white text-xs font-medium px-4 py-2.5 flex items-center justify-between shadow-md transition-all">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-300" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isLead ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                }`}
              >
                {stage} Stage Attachment Vault
              </span>
              <span className="font-mono text-xs text-stone-300 bg-stone-800 px-2 py-0.5 rounded">
                {entityNumber}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
              <span>{customerName}</span>
              {customerMobile && (
                <span className="text-xs font-mono font-normal text-stone-400">({customerMobile})</span>
              )}
            </h3>
            <p className="text-xs text-stone-400">
              Upload images, videos, and specs at this stage. Automatically stored in the central Documents archive with full activity logs.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 pt-3 bg-stone-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'attachments'
                  ? 'border-amber-700 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Attached Media ({linkedDocuments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-amber-700 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Attach Images / Videos / Files</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'border-amber-700 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Stage Activity Logs ({entityLogs.length})</span>
            </button>
          </div>

          {activeTab === 'attachments' && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] pb-1">
              <span className="text-stone-400 mr-1">Filter:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  filterType === 'all' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  filterType === 'image' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                Photos
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  filterType === 'video' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setFilterType('pdf')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  filterType === 'pdf' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                PDF / Specs
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: ATTACHMENTS GALLERY */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {filteredDocs.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-stone-200 rounded-xl space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-800">No attachments at this stage yet</h4>
                    <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                      Upload customer design references, resin sample videos, 3D mockups, or spec sheets to share with the client and archive in Documents.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Attach New Media Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDocs.map((doc) => {
                    const isVid = doc.fileType === 'video';
                    const isImg = doc.fileType === 'image';

                    return (
                      <div
                        key={doc.id}
                        className="bg-white rounded-xl border border-stone-200 shadow-xs hover:border-amber-300 transition-all overflow-hidden flex flex-col"
                      >
                        {/* Media Visual Header */}
                        <div className="relative h-40 bg-stone-900 flex items-center justify-center overflow-hidden group">
                          {isImg ? (
                            <img
                              src={doc.url}
                              alt={doc.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : isVid ? (
                            <div className="relative w-full h-full bg-stone-950 flex items-center justify-center">
                              <video
                                src={doc.url}
                                className="w-full h-full object-cover opacity-80"
                                preload="metadata"
                              />
                              <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md">
                                  <Film className="w-5 h-5 ml-0.5" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center text-stone-500 gap-2 p-4">
                              <FileText className="w-10 h-10 text-amber-700" />
                              <span className="text-xs font-semibold text-stone-700 text-center line-clamp-1">
                                {doc.name}
                              </span>
                            </div>
                          )}

                          {/* Category Badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className="text-[10px] font-semibold bg-stone-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md border border-white/20">
                              {doc.category}
                            </span>
                          </div>

                          {/* File Size & Type */}
                          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                            <span className="text-[10px] font-mono bg-black/70 text-stone-200 px-1.5 py-0.5 rounded">
                              {doc.size}
                            </span>
                          </div>

                          {/* Overlay Preview Button */}
                          <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-600 rounded-lg shadow-sm flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-xs text-stone-900 line-clamp-1 title" title={doc.name}>
                                {doc.name}
                              </h5>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove "${doc.name}" from documents?`)) {
                                    deleteDocument(doc.id);
                                    showToast(`Deleted "${doc.name}"`);
                                  }
                                }}
                                className="text-stone-400 hover:text-rose-600 transition-colors p-0.5"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {doc.notes && (
                              <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                                {doc.notes}
                              </p>
                            )}
                          </div>

                          {/* Sharing status info */}
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                            <span>Uploaded {doc.uploadedAt}</span>
                            {doc.sharedChannels && doc.sharedChannels.length > 0 ? (
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Shared via {doc.sharedChannels.join(', ')}
                              </span>
                            ) : (
                              <span className="text-stone-400">Not yet shared</span>
                            )}
                          </div>

                          {/* Action Toolbar */}
                          <div className="pt-2 grid grid-cols-4 gap-1.5">
                            <button
                              onClick={() => triggerWhatsAppShare(doc)}
                              className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
                              title="Share directly via WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>

                            <button
                              onClick={() => triggerEmailShare(doc)}
                              className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                              title="Share via Email"
                            >
                              <Mail className="w-3 h-3" />
                              <span className="hidden sm:inline">Email</span>
                            </button>

                            <button
                              onClick={() => handleCopyLink(doc)}
                              className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                              title="Copy Direct Link"
                            >
                              {copiedDocId === doc.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span className="hidden sm:inline">Copy</span>
                            </button>

                            <a
                              href={doc.url}
                              download={doc.name}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => shareDocument(doc.id, 'Download')}
                              className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                              title="Download File"
                            >
                              <Download className="w-3 h-3" />
                              <span className="hidden sm:inline">Save</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD & ATTACH NEW MEDIA */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {/* Preset Selector Banner */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    Quick Studio Presets for {stage} Stage:
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium">Click to populate form</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {studioPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-white text-stone-800 border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 rounded-lg shadow-2xs transition-all text-left flex items-center gap-1.5"
                    >
                      {preset.fileType === 'video' ? (
                        <Video className="w-3 h-3 text-rose-600 shrink-0" />
                      ) : preset.fileType === 'pdf' ? (
                        <FileText className="w-3 h-3 text-amber-700 shrink-0" />
                      ) : (
                        <ImageIcon className="w-3 h-3 text-emerald-600 shrink-0" />
                      )}
                      <span>{preset.name.replace(/_/g, ' ').substring(0, 32)}...</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-stone-300 rounded-xl p-5 text-center hover:border-amber-600 transition-colors bg-stone-50/50">
                <input
                  type="file"
                  id="stage-file-input"
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="stage-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 hover:underline">
                      Click to choose image, video or document
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Supports JPG, PNG, MP4, MOV, PDF, and design drawings up to 50 MB
                    </p>
                  </div>
                </label>
              </div>

              {/* Upload Details Form */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Attachment Metadata & Document Tagging
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Attachment Title *
                    </label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="e.g. Resin_Ocean_Wave_Sample_Video.mp4"
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Document Category *
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-700 focus:outline-none"
                    >
                      {isLead ? (
                        <>
                          <option value="Reference Photo">Reference Photo</option>
                          <option value="Product Sample Video">Product Sample Video</option>
                          <option value="Material Swatch">Material Swatch</option>
                          <option value="Client Requirement Spec">Client Requirement Spec</option>
                          <option value="Color Palette">Color Palette</option>
                          <option value="Product Catalog PDF">Product Catalog PDF</option>
                        </>
                      ) : (
                        <>
                          <option value="3D Render / Mockup">3D Render / Mockup</option>
                          <option value="Technical Drawing / Spec Sheet">Technical Drawing / Spec Sheet</option>
                          <option value="Product Sample Video">Product Sample Video</option>
                          <option value="Approval Proof">Approval Proof</option>
                          <option value="Material Swatch">Material Swatch</option>
                          <option value="Quotation PDF">Quotation PDF</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      File Type
                    </label>
                    <select
                      value={uploadFileType}
                      onChange={(e) => setUploadFileType(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-700 focus:outline-none"
                    >
                      <option value="image">Image (JPG, PNG, WEBP)</option>
                      <option value="video">Video (MP4, WebM)</option>
                      <option value="pdf">PDF Document</option>
                      <option value="document">Other Document / Spec</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Approximate Size
                    </label>
                    <input
                      type="text"
                      value={uploadSize}
                      onChange={(e) => setUploadSize(e.target.value)}
                      placeholder="e.g. 2.4 MB"
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Direct Media URL (Optional preview link or Cloud Storage URL)
                  </label>
                  <input
                    type="text"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://... or paste image / video link"
                    className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Notes / Customization Details
                  </label>
                  <textarea
                    rows={2}
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="e.g. Highlighted gold leaf dispersion and bubble-free resin clarity for client confirmation..."
                    className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-700 focus:outline-none"
                  />
                </div>

                {/* Submit Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => handleSaveAttachment(false)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-stone-600" />
                    <span>Store to Documents Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveAttachment(true)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Store & Share via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAGE ACTIVITY & AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-xs font-bold text-stone-800">
                  Chronological Log for {stage} #{entityNumber}
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  {entityLogs.length} audit entries
                </span>
              </div>

              {entityLogs.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No activity logs recorded yet for this stage.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-stone-200">
                  {entityLogs.map((log) => {
                    const isShared = log.action === 'ATTACHMENT_SHARED';
                    const isUpload = log.action === 'ATTACHMENT_UPLOADED';

                    return (
                      <div key={log.id} className="relative flex items-start gap-3 pl-1">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 z-10 shadow-xs ${
                            isShared
                              ? 'bg-emerald-600'
                              : isUpload
                              ? 'bg-amber-700'
                              : 'bg-indigo-600'
                          }`}
                        >
                          {isShared ? (
                            <Share2 className="w-3 h-3" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                        </div>

                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold text-stone-900">{log.title}</span>
                            <span className="text-[10px] font-mono text-stone-400">{log.timestamp}</span>
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed">{log.description}</p>
                          <div className="flex items-center gap-3 pt-1 text-[10px] text-stone-400 font-medium">
                            <span>Actor: {log.performedBy}</span>
                            {log.metadata?.shareChannel && (
                              <span className="text-emerald-700 font-semibold">
                                Channel: {log.metadata.shareChannel}
                              </span>
                            )}
                            {log.metadata?.category && (
                              <span>Category: {log.metadata.category}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Central Documents synchronization active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
          >
            Close Vault
          </button>
        </div>
      </div>

      {/* FULL PREVIEW LIGHTBOX MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-stone-900 rounded-2xl border border-stone-700 max-w-3xl w-full p-4 overflow-hidden flex flex-col max-h-[90vh] text-white">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h4 className="font-semibold text-sm">{previewDoc.name}</h4>
                <p className="text-xs text-stone-400">
                  {previewDoc.category} • {previewDoc.size} • {previewDoc.stage} Stage
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-stone-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 flex items-center justify-center bg-black/50 rounded-xl overflow-hidden min-h-[300px] max-h-[550px]">
              {previewDoc.fileType === 'image' ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-h-[520px] max-w-full object-contain rounded-lg"
                />
              ) : previewDoc.fileType === 'video' ? (
                <video
                  src={previewDoc.url}
                  controls
                  autoPlay
                  className="max-h-[520px] max-w-full rounded-lg"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-amber-500 mx-auto" />
                  <p className="text-sm font-semibold">{previewDoc.name}</p>
                  <p className="text-xs text-stone-400 max-w-md">
                    Standard document preview available via download or direct link.
                  </p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-600 rounded-lg text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
              <span className="text-stone-400">{previewDoc.notes || 'No notes specified.'}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerWhatsAppShare(previewDoc)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </button>
                <a
                  href={previewDoc.url}
                  download={previewDoc.name}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
