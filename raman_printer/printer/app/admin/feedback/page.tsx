'use client';

import { useState, useEffect } from 'react';
import { Star, Send, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/admin/feedback');
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedbacks);
      }
    } catch (error) {
      console.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (feedbackId: string) => {
    if (!replyText.trim()) return;

    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Reply submitted successfully');
        setReplyText('');
        setReplyingTo(null);
        fetchFeedbacks();
      } else {
        toast.error(data.error || 'Failed to submit reply');
      }
    } catch (error) {
      toast.error('Failed to submit reply');
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    setDeleting(feedbackId);
    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Feedback deleted successfully');
        fetchFeedbacks();
      } else {
        toast.error(data.error || 'Failed to delete feedback');
      }
    } catch (error) {
      toast.error('Failed to delete feedback');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Feedbacks</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and respond to user feedback</p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No feedback submitted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <div key={feedback._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
              {/* User Info */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {feedback.userId?.fullName || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {feedback.userId?.whatsappNumber}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {feedback.rating && (
                      <div className="flex gap-1">
                        {[...Array(feedback.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(feedback.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(feedback._id)}
                  disabled={deleting === feedback._id}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete feedback"
                >
                  {deleting === feedback._id ? (
                    <div className="h-5 w-5 border-2 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Feedback Message */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-gray-700 dark:text-gray-300">{feedback.message}</p>
              </div>

              {/* Admin Reply */}
              {feedback.adminReply ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/60 border-l-4 border-indigo-600 dark:border-indigo-400 pl-4 py-3">
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-1">Your Reply:</p>
                  <p className="text-sm text-indigo-800 dark:text-indigo-200">{feedback.adminReply}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    {new Date(feedback.adminRepliedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ) : replyingTo === feedback._id ? (
                <div className="space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Type your reply..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(feedback._id)}
                      className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Send Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(feedback._id)}
                  className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium"
                >
                  Reply
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
