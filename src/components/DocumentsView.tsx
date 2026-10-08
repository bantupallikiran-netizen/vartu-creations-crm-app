import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { CrmDocument, StageType, DocumentFileType } from '../types.ts';
import {
  FolderOpen,
  FileText,
  Upload,
  Download,
  Search,
  CheckCircle2,
  Share2,
  Eye,
  Trash2,
  Film,
  Image as ImageIcon,
  Clock,
  Filter,
  Grid,
  List,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Mail,
  Copy,
  Check,
  X,
  FileCheck,
  Layers,
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const {
    documents,
    activityLogs,
    leads,
    quotations,
    orders,
    addDocument,
    deleteDocument,
    shareDocument,
  } = useCrm();

  // Navigation & Filtering
  const [activeMainTab, setActiveMainTab] = useState<'documents' | 'auditLogs'>('documents');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Preview & Upload Modals
  const [previewDoc, setPreviewDoc] = useState<CrmDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadStage, setUploadStage] = useState<StageType>('Lead');
  const [uploadLinkedId, setUploadLinkedId] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Reference Photo');
  const [uploadFileType, setUploadFileType] = useState<DocumentFileType>('image');
  const [uploadSize, setUploadSize] = useState('2.0 MB');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');

  // Count metrics by stage
  const leadDocsCount = documents.filter((d) => d.stage === 'Lead').length;
  const quotationDocsCount = documents.filter((d) => d.stage === 'Quotation').length;
  const orderDocsCount = documents.filter((d) => d.stage === 'Order' || d.stage === 'Invoice').length;

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesStage = selectedStage === 'all' || doc.stage.toLowerCase() === selectedStage.toLowerCase();
    const matchesFileType = selectedFileType === 'all' || doc.fileType === selectedFileType;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.linkedCustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.linkedEntityNumber && doc.linkedEntityNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStage && matchesFileType && matchesSearch;
  });

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
      setUploadUrl(uploadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) {
      alert('Please provide a document title.');
      return;
    }

    // Resolve customer and entity details based on stage and selected link
    let entityId = uploadLinkedId;
    let entityNum = '';
    let custName = 'General Customer';
    let custMobile = '';
    let custEmail = '';

    if (uploadStage === 'Lead') {
      const foundLead = leads.find((l) => l.id === uploadLinkedId) || leads[0];
      if (foundLead) {
        entityId = foundLead.id;
        entityNum = foundLead.leadNumber;
        custName = foundLead.customerName;
        custMobile = foundLead.whatsapp || foundLead.mobile;
        custEmail = foundLead.email || '';
      }
    } else if (uploadStage === 'Quotation') {
      const foundQt = quotations.find((q) => q.id === uploadLinkedId) || quotations[0];
      if (foundQt) {
        entityId = foundQt.id;
        entityNum = foundQt.quotationNumber;
        custName = foundQt.customerName;
        custMobile = foundQt.customerMobile;
        custEmail = foundQt.customerEmail || '';
      }
    } else if (uploadStage === 'Order') {
      const foundOrd = orders.find((o) => o.id === uploadLinkedId) || orders[0];
      if (foundOrd) {
        entityId = foundOrd.id;
        entityNum = foundOrd.orderNumber;
        custName = foundOrd.customerName;
        custMobile = foundOrd.customerMobile;
        custEmail = foundOrd.customerEmail || '';
      }
    }

    const defaultUrl =
      uploadFileType === 'image'
        ? 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80'
        : uploadFileType === 'video'
        ? 'https://assets.mixkit.co/videos/preview/mixkit-craftsman-polishing-a-wooden-piece-41484-large.mp4'
        : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    const newDoc = addDocument({
      name: uploadName,
      fileType: uploadFileType,
      url: uploadUrl || defaultUrl,
      thumbnailUrl: uploadFileType === 'image' ? (uploadUrl || defaultUrl) : undefined,
      size: uploadSize,
      stage: uploadStage,
      linkedEntityId: entityId || `ref-${Date.now()}`,
      linkedEntityNumber: entityNum,
      linkedCustomerName: custName,
      customerMobile: custMobile,
      customerEmail: custEmail,
      category: uploadCategory,
      notes: uploadNotes,
      uploadedBy: 'Vartu Studio',
      sharedChannels: [],
    });

    showToast(`"${newDoc.name}" archived in Documents and logged to ${uploadStage} stage!`);
    setShowUploadModal(false);
    setUploadName('');
    setUploadUrl('');
    setUploadNotes('');
  };

  const handleShareWhatsApp = (doc: CrmDocument) => {
    const cleanPhone = (doc.customerMobile || '').replace(/\D/g, '');
    const msg = `Namaste ${doc.linkedCustomerName}! 🌸\nGreetings from Vartu Creations.\n\nSharing ${doc.category} (${doc.stage} Stage):\n📎 *${doc.name}*\n${doc.linkedEntityNumber ? `Reference: ${doc.linkedEntityNumber}\n` : ''}${doc.notes ? `Note: ${doc.notes}\n` : ''}\nPreview: ${doc.url}\n\nThank you for choosing artisanal craftsmanship!`;

    shareDocument(doc.id, 'WhatsApp', cleanPhone);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    showToast(`Shared "${doc.name}" via WhatsApp & recorded in ${doc.stage} audit log!`);
  };

  const handleShareEmail = (doc: CrmDocument) => {
    const to = doc.customerEmail || '';
    const subject = `Vartu Creations Document: ${doc.name} (${doc.stage} Stage)`;
    const body = `Dear ${doc.linkedCustomerName},\n\nPlease find attached:\n${doc.name} (${doc.category})\nLink: ${doc.url}\n\nBest regards,\nVartu Creations`;

    shareDocument(doc.id, 'Email', to);
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    showToast(`Dispatched email link & logged activity!`);
  };

  const handleCopyLink = (doc: CrmDocument) => {
    navigator.clipboard.writeText(doc.url);
    setCopiedId(doc.id);
    shareDocument(doc.id, 'Direct Link');
    showToast(`Copied document link to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-800 text-white text-xs font-medium px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md transition-all">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <FolderOpen className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
              Central Documents & Media Repository
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Unified vault for design references, resin sample videos, 3D mockups, spec sheets, and stage-linked audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab(activeMainTab === 'documents' ? 'auditLogs' : 'documents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              activeMainTab === 'auditLogs'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Stage Audit Logs ({activityLogs.length})</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Stage KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setSelectedStage('all');
            setActiveMainTab('documents');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStage === 'all'
              ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="text-[11px] font-medium text-stone-500">All Attachments</div>
          <div className="text-xl font-bold font-serif text-stone-900 mt-1">{documents.length}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Across all pipeline stages</div>
        </button>

        <button
          onClick={() => {
            setSelectedStage('lead');
            setActiveMainTab('documents');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStage === 'lead'
              ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-800 flex items-center justify-between">
            <span>Leads Stage</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-xl font-bold font-serif text-amber-950 mt-1">{leadDocsCount}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Inquiry photos, samples & videos</div>
        </button>

        <button
          onClick={() => {
            setSelectedStage('quotation');
            setActiveMainTab('documents');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStage === 'quotation'
              ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="text-[11px] font-medium text-indigo-800 flex items-center justify-between">
            <span>Quotations Stage</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <div className="text-xl font-bold font-serif text-indigo-950 mt-1">{quotationDocsCount}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">3D renders, specs & finish proofs</div>
        </button>

        <button
          onClick={() => {
            setSelectedStage('order');
            setActiveMainTab('documents');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStage === 'order'
              ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="text-[11px] font-medium text-purple-800 flex items-center justify-between">
            <span>Orders & Invoices</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </div>
          <div className="text-xl font-bold font-serif text-purple-950 mt-1">{orderDocsCount}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Approval slips, GST bills & receipts</div>
        </button>
      </div>

      {activeMainTab === 'documents' ? (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search file name, customer, stage, category, or note..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 text-stone-800"
                />
              </div>

              {/* Stage Filter */}
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-700 font-medium"
              >
                <option value="all">All Stages</option>
                <option value="lead">Leads Stage</option>
                <option value="quotation">Quotations Stage</option>
                <option value="order">Orders Stage</option>
                <option value="invoice">Invoices Stage</option>
              </select>

              {/* Type Filter */}
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-700 font-medium"
              >
                <option value="all">All File Types</option>
                <option value="image">Photos & Images</option>
                <option value="video">Sample Videos</option>
                <option value="pdf">PDF Documents</option>
                <option value="document">Other Docs / Specs</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg border transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg border transition-colors ${
                  viewMode === 'table'
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => {
                const isVid = doc.fileType === 'video';
                const isImg = doc.fileType === 'image';

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-stone-200 shadow-xs hover:border-amber-300 transition-all overflow-hidden flex flex-col group"
                  >
                    {/* Media Thumbnail */}
                    <div className="relative h-44 bg-stone-900 flex items-center justify-center overflow-hidden">
                      {isImg ? (
                        <img
                          src={doc.url}
                          alt={doc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : isVid ? (
                        <div className="relative w-full h-full bg-stone-950 flex items-center justify-center">
                          <video src={doc.url} className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md">
                              <Film className="w-5 h-5 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-stone-50 flex flex-col items-center justify-center text-stone-500 gap-2 p-4">
                          <FileText className="w-10 h-10 text-amber-700" />
                          <span className="text-xs font-semibold text-stone-700 text-center line-clamp-1">
                            {doc.name}
                          </span>
                        </div>
                      )}

                      {/* Stage Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs ${
                            doc.stage === 'Lead'
                              ? 'bg-amber-600 text-white'
                              : doc.stage === 'Quotation'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          {doc.stage} Stage
                        </span>
                      </div>

                      {/* Size */}
                      <div className="absolute top-2 right-2 z-10">
                        <span className="text-[10px] font-mono bg-black/75 text-white px-1.5 py-0.5 rounded">
                          {doc.size}
                        </span>
                      </div>

                      {/* Quick Preview Hover */}
                      <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-600 rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Media</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-stone-900 line-clamp-1" title={doc.name}>
                            {doc.name}
                          </h4>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${doc.name}" from documents?`)) {
                                deleteDocument(doc.id);
                                showToast(`Deleted "${doc.name}"`);
                              }
                            }}
                            className="text-stone-300 hover:text-rose-600 p-0.5 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] font-medium text-stone-600 mt-1 flex items-center justify-between">
                          <span>{doc.category}</span>
                          <span className="text-stone-400 font-mono text-[10px]">{doc.linkedEntityNumber}</span>
                        </div>

                        <div className="text-[11px] text-stone-800 font-semibold mt-0.5 truncate">
                          {doc.linkedCustomerName}
                        </div>

                        {doc.notes && (
                          <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                            {doc.notes}
                          </p>
                        )}
                      </div>

                      {/* Footer & Share Toolbar */}
                      <div className="pt-2 border-t border-stone-100 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-stone-400">
                          <span>{doc.uploadedAt}</span>
                          {doc.sharedChannels && doc.sharedChannels.length > 0 && (
                            <span className="text-emerald-700 font-medium">
                              Via {doc.sharedChannels.join(', ')}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-1">
                          <button
                            onClick={() => handleShareWhatsApp(doc)}
                            className="py-1 text-[10px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center justify-center gap-1 shadow-2xs"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WA</span>
                          </button>

                          <button
                            onClick={() => handleShareEmail(doc)}
                            className="py-1 text-[10px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors flex items-center justify-center gap-1"
                            title="Share via Email"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Email</span>
                          </button>

                          <button
                            onClick={() => handleCopyLink(doc)}
                            className="py-1 text-[10px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors flex items-center justify-center gap-1"
                            title="Copy Direct Link"
                          >
                            {copiedId === doc.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Link</span>
                          </button>

                          <a
                            href={doc.url}
                            download={doc.name}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => shareDocument(doc.id, 'Download')}
                            className="py-1 text-[10px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors flex items-center justify-center gap-1"
                            title="Download File"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Document Title</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Linked Customer / Order</th>
                      <th className="py-3 px-4">Date Uploaded</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {doc.fileType === 'video' ? (
                              <Film className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : doc.fileType === 'image' ? (
                              <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                            )}
                            <span className="font-semibold text-stone-900">{doc.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              doc.stage === 'Lead'
                                ? 'bg-amber-100 text-amber-900'
                                : doc.stage === 'Quotation'
                                ? 'bg-indigo-100 text-indigo-900'
                                : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {doc.stage}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-stone-600 font-medium">{doc.category}</td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-800">{doc.linkedCustomerName}</div>
                          {doc.linkedEntityNumber && (
                            <div className="text-[10px] font-mono text-stone-400 mt-0.5">
                              {doc.linkedEntityNumber}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                          {doc.uploadedAt}
                        </td>

                        <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">{doc.size}</td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(doc)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={doc.url}
                              download={doc.name}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => shareDocument(doc.id, 'Download')}
                              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${doc.name}"?`)) deleteDocument(doc.id);
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
              <FolderOpen className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500">No documents match the current filter or search criteria.</p>
            </div>
          )}
        </div>
      ) : (
        /* AUDIT LOGS VIEW */
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Complete Stage Activity & Attachment Audit Trail</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Full chronological ledger of media shared and stored with respect to each customer and pipeline stage.
              </p>
            </div>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-stone-200 pl-1">
            {activityLogs.map((log) => {
              const isShared = log.action === 'ATTACHMENT_SHARED';
              const isUpload = log.action === 'ATTACHMENT_UPLOADED';

              return (
                <div key={log.id} className="relative flex items-start gap-3 pl-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 z-10 shadow-xs ${
                      isShared
                        ? 'bg-emerald-600'
                        : isUpload
                        ? 'bg-amber-700'
                        : 'bg-indigo-600'
                    }`}
                  >
                    {isShared ? (
                      <Share2 className="w-3.5 h-3.5" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            log.stage === 'Lead'
                              ? 'bg-amber-200 text-amber-900'
                              : log.stage === 'Quotation'
                              ? 'bg-indigo-200 text-indigo-900'
                              : 'bg-purple-200 text-purple-900'
                          }`}
                        >
                          {log.stage}
                        </span>
                        <span className="text-xs font-bold text-stone-900">{log.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">{log.timestamp}</span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">{log.description}</p>

                    <div className="flex items-center gap-3 pt-1.5 text-[10px] text-stone-400 font-medium">
                      <span>Customer: <strong className="text-stone-700">{log.customerName}</strong></span>
                      {log.entityNumber && <span>Ref: <strong className="text-stone-700 font-mono">{log.entityNumber}</strong></span>}
                      <span>Performed by: {log.performedBy}</span>
                      {log.metadata?.shareChannel && (
                        <span className="text-emerald-700 font-bold">
                          Dispatched via {log.metadata.shareChannel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full p-5 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">Upload to Documents Archive</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4 text-xs">
              {/* File picker */}
              <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:border-amber-600 transition-colors bg-stone-50/50">
                <input
                  type="file"
                  id="modal-file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label htmlFor="modal-file-upload" className="cursor-pointer block">
                  <Upload className="w-6 h-6 text-amber-700 mx-auto mb-1" />
                  <span className="font-semibold text-stone-800 hover:underline">Select image, video, or spec file</span>
                  <p className="text-[10px] text-stone-400 mt-0.5">JPG, PNG, MP4, PDF, CAD specs</p>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Resin_Floral_Coaster_Approval_Video.mp4"
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pipeline Stage *</label>
                  <select
                    value={uploadStage}
                    onChange={(e) => {
                      const st = e.target.value as StageType;
                      setUploadStage(st);
                      if (st === 'Lead') setUploadCategory('Reference Photo');
                      else if (st === 'Quotation') setUploadCategory('3D Render / Mockup');
                      else setUploadCategory('Approval Proof');
                    }}
                    className="w-full px-3 py-1.5 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-700 focus:outline-none"
                  >
                    <option value="Lead">Lead Stage</option>
                    <option value="Quotation">Quotation Stage</option>
                    <option value="Order">Order / Production Stage</option>
                    <option value="General">General Studio Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-700 focus:outline-none"
                  >
                    <option value="Reference Photo">Reference Photo</option>
                    <option value="Product Sample Video">Product Sample Video</option>
                    <option value="3D Render / Mockup">3D Render / Mockup</option>
                    <option value="Technical Drawing / Spec Sheet">Technical Drawing / Spec Sheet</option>
                    <option value="Material Swatch">Material Swatch</option>
                    <option value="Approval Proof">Approval Proof</option>
                    <option value="Quotation PDF">Quotation PDF</option>
                    <option value="Tax Invoice">Tax Invoice</option>
                  </select>
                </div>
              </div>

              {/* Link to active entity */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Link to Existing {uploadStage} Contact
                </label>
                <select
                  value={uploadLinkedId}
                  onChange={(e) => setUploadLinkedId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-700 focus:outline-none font-medium"
                >
                  <option value="">Select an active {uploadStage.toLowerCase()}...</option>
                  {uploadStage === 'Lead' &&
                    leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.customerName} ({l.leadNumber})
                      </option>
                    ))}
                  {uploadStage === 'Quotation' &&
                    quotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.customerName} ({q.quotationNumber})
                      </option>
                    ))}
                  {uploadStage === 'Order' &&
                    orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.customerName} ({o.orderNumber})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Additional context or artisan notes..."
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-700 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs"
                >
                  Upload & Record Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-stone-900 rounded-2xl border border-stone-700 max-w-3xl w-full p-4 overflow-hidden flex flex-col max-h-[90vh] text-white">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h4 className="font-semibold text-sm">{previewDoc.name}</h4>
                <p className="text-xs text-stone-400">
                  {previewDoc.category} • {previewDoc.size} • {previewDoc.stage} Stage • {previewDoc.linkedCustomerName}
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
                    Standard document preview available via direct link or download.
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
                  onClick={() => handleShareWhatsApp(previewDoc)}
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
