"use client";

import { db } from "@/lib/db";
import { type AppSchema } from "@/instant.schema";
import { id, InstaQLEntity } from "@instantdb/react";
import { useState } from "react";

type Review = InstaQLEntity<AppSchema, "reviews">;

const SECTIONS = {
  "growing-instant": { label: "Growing Instant", emoji: "🌱" },
  "planning-wedding": { label: "Planning My Wedding", emoji: "💍" },
  "best-shape": { label: "Getting Into the Best Shape of My Life", emoji: "💪" },
} as const;

type SectionId = keyof typeof SECTIONS;

function App() {
  const { isLoading, error, data } = db.useQuery({
    reviews: { $: { order: { createdAt: "desc" } } },
  });
  const [view, setView] = useState<"read" | "write">("read");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">Error: {error.message}</div>
      </div>
    );
  }

  const { reviews } = data;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Minimal Header */}
      <header className="sticky top-0 z-20 bg-[#fafafa]/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-900">Reviews</h1>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("read")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                view === "read"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Read
            </button>
            <button
              onClick={() => setView("write")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                view === "write"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Write
            </button>
          </div>
        </div>
      </header>

      {view === "read" ? (
        <ReadView
          reviews={reviews}
          editingId={editingId}
          setEditingId={setEditingId}
        />
      ) : (
        <WriteView onComplete={() => setView("read")} />
      )}
    </div>
  );
}

function ReadView({
  reviews,
  editingId,
  setEditingId,
}: {
  reviews: Review[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
}) {
  if (reviews.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-gray-400 text-lg">No reviews yet</p>
        <p className="text-gray-300 mt-2">Switch to Write to add your first review</p>
      </div>
    );
  }

  // Group reviews by section
  const groupedBySection = reviews.reduce(
    (acc, review) => {
      const section = review.section as SectionId;
      if (!acc[section]) acc[section] = [];
      acc[section].push(review);
      return acc;
    },
    {} as Record<SectionId, Review[]>
  );

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="space-y-16">
        {(Object.keys(SECTIONS) as SectionId[]).map((sectionId) => {
          const sectionReviews = groupedBySection[sectionId];
          if (!sectionReviews?.length) return null;

          return (
            <section key={sectionId}>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span>{SECTIONS[sectionId].emoji}</span>
                {SECTIONS[sectionId].label}
              </h2>
              <div className="space-y-8">
                {sectionReviews.map((review) => (
                  <ReviewEntry
                    key={review.id}
                    review={review}
                    isEditing={editingId === review.id}
                    onEdit={() => setEditingId(review.id)}
                    onClose={() => setEditingId(null)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function ReviewEntry({
  review,
  isEditing,
  onEdit,
  onClose,
}: {
  review: Review;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [editTitle, setEditTitle] = useState(review.title);
  const [editContent, setEditContent] = useState(review.content);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSave = () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    db.transact(
      db.tx.reviews[review.id].update({
        title: editTitle.trim(),
        content: editContent.trim(),
      })
    );
    onClose();
  };

  const handleDelete = () => {
    db.transact(db.tx.reviews[review.id].delete());
    onClose();
  };

  if (isEditing) {
    return (
      <article className="group">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full text-xl font-medium text-gray-900 bg-transparent border-b border-gray-200 pb-2 mb-4 focus:outline-none focus:border-gray-400"
          autoFocus
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={6}
          className="w-full text-gray-600 leading-relaxed bg-transparent border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-gray-400 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 ml-auto"
          >
            Delete
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="group cursor-pointer" onClick={onEdit}>
      <time className="text-xs text-gray-300 block mb-2">
        {formatDate(review.createdAt)}
      </time>
      <h3 className="text-xl font-medium text-gray-900 mb-3 group-hover:text-gray-600 transition-colors">
        {review.title}
      </h3>
      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
        {review.content}
      </p>
    </article>
  );
}

function WriteView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"section" | "content">("section");
  const [selectedSection, setSelectedSection] = useState<SectionId | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!selectedSection || !title.trim() || !content.trim()) return;

    db.transact(
      db.tx.reviews[id()].update({
        title: title.trim(),
        content: content.trim(),
        section: selectedSection,
        createdAt: Date.now(),
      })
    );

    setTitle("");
    setContent("");
    setSelectedSection(null);
    setStep("section");
    onComplete();
  };

  if (step === "section") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-medium text-gray-900 mb-2">New Review</h2>
        <p className="text-gray-400 mb-10">What area of your life is this about?</p>

        <div className="space-y-3">
          {(Object.keys(SECTIONS) as SectionId[]).map((sectionId) => (
            <button
              key={sectionId}
              onClick={() => {
                setSelectedSection(sectionId);
                setStep("content");
              }}
              className="w-full text-left px-5 py-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
            >
              <span className="text-xl mr-3">{SECTIONS[sectionId].emoji}</span>
              <span className="text-gray-900 group-hover:text-gray-600">
                {SECTIONS[sectionId].label}
              </span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <button
        onClick={() => setStep("section")}
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="flex items-center gap-2 mb-8">
        <span className="text-xl">{SECTIONS[selectedSection!].emoji}</span>
        <span className="text-sm text-gray-400">{SECTIONS[selectedSection!].label}</span>
      </div>

      <div className="space-y-6">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full text-2xl font-medium text-gray-900 bg-transparent placeholder-gray-300 focus:outline-none"
            autoFocus
          />
        </div>

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts..."
            rows={12}
            className="w-full text-gray-600 leading-relaxed bg-transparent placeholder-gray-300 focus:outline-none resize-none"
          />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              title.trim() && content.trim()
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            Save Review
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;
