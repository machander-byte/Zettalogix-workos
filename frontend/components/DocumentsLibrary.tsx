'use client';

import { useEffect, useMemo, useState } from 'react';
import { documentService } from '@/services/documentService';
import { IDocument } from '@/types';

type Props = {
  canUpload?: boolean;
};

const parseList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function DocumentsLibrary({ canUpload }: Props) {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    tags: '',
    accessRoles: ''
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setLoading(true);
    documentService
      .list()
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const doc = await documentService.upload({
        file,
        name: form.name || undefined,
        description: form.description || undefined,
        tags: parseList(form.tags),
        accessRoles: parseList(form.accessRoles)
      });
      setDocuments((prev) => [doc, ...prev]);
      setForm({ name: '', description: '', tags: '', accessRoles: '' });
      setFile(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const hasDocs = documents.length > 0;
  const sorted = useMemo(
    () => [...documents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [documents]
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Documents</p>
        <h1 className="text-2xl font-semibold text-slate-900">Shared document library</h1>
        <p className="text-sm text-slate-600">
          Store SOPs, reference decks, and templates. Access is filtered by role.
        </p>
      </div>

      {canUpload && (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Upload document</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="File name (optional)"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="Access roles (comma separated)"
              value={form.accessRoles}
              onChange={(e) => setForm((prev) => ({ ...prev, accessRoles: e.target.value }))}
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="file"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow disabled:opacity-60"
              onClick={handleUpload}
              disabled={uploading || !file}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Available files</p>
        {loading && <p className="mt-3 text-sm text-slate-500">Loading documents...</p>}
        {!loading && !hasDocs && (
          <p className="mt-3 text-sm text-slate-500">No documents shared yet.</p>
        )}
        <div className="mt-4 space-y-3">
          {sorted.map((doc) => (
            <div
              key={doc._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-500">
                  {doc.description || 'No description'} ·{' '}
                  {doc.uploadedBy?.name || doc.uploadedBy?.email || 'System'}
                </p>
                {doc.tags?.length ? (
                  <p className="mt-1 text-xs text-slate-500">Tags: {doc.tags.join(', ')}</p>
                ) : null}
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
