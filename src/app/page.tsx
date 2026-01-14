"use client";

import { db } from "@/lib/db";
import { type AppSchema } from "@/instant.schema";
import { id, InstaQLEntity } from "@instantdb/react";
import { useState } from "react";

type Review = InstaQLEntity<AppSchema, "reviews">;

const SECTIONS = [
  { id: "growing-instant", label: "Growing Instant", color: "from-violet-500 to-purple-600" },
  { id: "planning-wedding", label: "Planning My Wedding", color: "from-rose-400 to-pink-500" },
  { id: "best-shape", label: "Getting Into the Best Shape of My Life", color: "from-emerald-400 to-teal-500" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function App() {
  const { isLoading, error, data } = db.useQuery({
    reviews: { $: { order: { createdAt: "desc" } } },
  });
  const [activeSection, setActiveSection] = useState<SectionId>("growing-instant");
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-red-400 p-4">Error: {error.message}</div>
      </div>
    );
  }

  const { reviews } = data;
  const currentSection = SECTIONS.find((s) => s.id === activeSection)!;
  const sectionReviews = reviews.filter((r) => r.section === activeSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">My Reviews</h1>
          <p className="text-gray-400 mt-1">Track progress across life's important areas</p>
        </div>
      </header>

      {/* Section Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-3">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
                activeSection === section.id
                  ? `bg-gradient-to-r ${section.color} text-white shadow-lg shadow-${section.color.split("-")[1]}-500/25`
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Review Card */}
          <div className="lg:col-span-1">
            <AddReviewCard section={activeSection} sectionColor={currentSection.color} />
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className={`bg-gradient-to-r ${currentSection.color} px-6 py-4`}>
                <h2 className="text-xl font-semibold text-white">
                  {currentSection.label}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {sectionReviews.length} review{sectionReviews.length !== 1 ? "s" : ""}
                </p>
              </div>

              {sectionReviews.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-gray-500 text-lg">No reviews yet</div>
                  <p className="text-gray-600 mt-2 text-sm">
                    Add your first review for this section
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {sectionReviews.map((review) => (
                    <ReviewItem
                      key={review.id}
                      review={review}
                      isEditing={editingReview?.id === review.id}
                      onEdit={() => setEditingReview(review)}
                      onCancelEdit={() => setEditingReview(null)}
                      onSaveEdit={() => setEditingReview(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AddReviewCard({
  section,
  sectionColor,
}: {
  section: SectionId;
  sectionColor: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    db.transact(
      db.tx.reviews[id()].update({
        title: title.trim(),
        content: content.trim(),
        section,
        createdAt: Date.now(),
      })
    );

    setTitle("");
    setContent("");
  };

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden sticky top-24">
      <div className={`bg-gradient-to-r ${sectionColor} px-6 py-4`}>
        <h3 className="text-lg font-semibold text-white">Add Review</h3>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you reviewing?"
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Review
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, progress, or reflections..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={!title.trim() || !content.trim()}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            title.trim() && content.trim()
              ? `bg-gradient-to-r ${sectionColor} text-white hover:opacity-90 shadow-lg`
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          Add Review
        </button>
      </form>
    </div>
  );
}

function ReviewItem({
  review,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
}: {
  review: Review;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
}) {
  const [editTitle, setEditTitle] = useState(review.title);
  const [editContent, setEditContent] = useState(review.content);

  const handleSave = () => {
    if (!editTitle.trim() || !editContent.trim()) return;

    db.transact(
      db.tx.reviews[review.id].update({
        title: editTitle.trim(),
        content: editContent.trim(),
      })
    );
    onSaveEdit();
  };

  const handleDelete = () => {
    db.transact(db.tx.reviews[review.id].delete());
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isEditing) {
    return (
      <div className="p-6 bg-gray-900/30">
        <div className="space-y-4">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 hover:bg-gray-800/30 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-medium text-white truncate">{review.title}</h4>
          <p className="text-gray-400 mt-2 whitespace-pre-wrap">{review.content}</p>
          <p className="text-gray-500 text-sm mt-3">{formatDate(review.createdAt)}</p>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
