import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import GenerativeUI from '../components/GenerativeUI';
import AllergyDangerBanner from '../components/AllergyDangerBanner';
import { useChat } from '../hooks/useChat';
import { auth, recommendations } from '../lib/kairosClient';

const Results = () => {
  const location = useLocation();
  const searchQuery = location.state?.searchQuery || '';
  const uid = auth.getUid();

  // Chat-based search
  const { sendMessage, result, thinkingStep, thinkingLabel, isStreaming, error } = useChat(uid);

  // Recommendation feed
  const [recs, setRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsError, setRecsError] = useState(null);

  // Load recommendations on mount
  useEffect(() => {
    if (!uid) return;
    setRecsLoading(true);
    recommendations
      .getAll(uid)
      .then((data) => setRecs(data.recommendations ?? data))
      .catch((err) => setRecsError(err?.detail || 'Failed to load recommendations'))
      .finally(() => setRecsLoading(false));
  }, [uid]);

  // Auto-search if query was passed from SearchBar navigation
  useEffect(() => {
    if (searchQuery && uid) {
      sendMessage(searchQuery);
    }
    // Only trigger on mount / when searchQuery changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleFollowUp = (question) => {
    sendMessage(question);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <SearchBar variant="default" />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Thinking indicator */}
        {isStreaming && thinkingLabel && (
          <div className="flex items-center gap-3 mb-6 bg-primary-50 border border-primary-200 rounded-xl px-5 py-3">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary-700">{thinkingLabel}</span>
          </div>
        )}

        {/* Stream error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Chat result — Generative UI */}
        {result && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Response</h2>

            {/* ALWAYS render allergy danger banner when flagged restaurants exist */}
            {result.flagged_restaurants?.length > 0 && (
              <AllergyDangerBanner restaurants={result.flagged_restaurants} />
            )}

            <GenerativeUI payload={result} onFollowUp={handleFollowUp} />

            {result.confidence_note && (
              <p className="mt-3 text-sm text-gray-500 italic">{result.confidence_note}</p>
            )}
          </div>
        )}

        {/* Divider */}
        {result && recs.length > 0 && (
          <hr className="my-8 border-gray-200" />
        )}

        {/* Recommendation feed */}
        {!result && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {searchQuery ? `Results for "${searchQuery}"` : 'Your Recommendations'}
              </h1>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-yellow-50 border border-primary-200 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">AI Powered</span>
              </div>
            </div>

            {recsLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-5 shadow-md animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {recsError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-red-700 text-sm">
                {recsError}
              </div>
            )}

            {!recsLoading && !recsError && recs.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-2">No recommendations yet</h3>
                <p className="text-gray-600">Try searching for something above!</p>
              </div>
            )}

            {!recsLoading && recs.length > 0 && (
              <div className="space-y-4">
                {recs.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{r.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          {r.area && <span>📍 {r.area}</span>}
                          {r.price_tier && <span>{r.price_tier}</span>}
                          {r.rating != null && <span>⭐ {r.rating}</span>}
                        </div>
                      </div>
                      {r.fit_score != null && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            r.fit_score >= 80
                              ? 'bg-green-50 text-green-700'
                              : r.fit_score >= 60
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.fit_score}% fit
                        </span>
                      )}
                    </div>

                    {r.cuisine_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {r.cuisine_types.map((c, i) => (
                          <span
                            key={i}
                            className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {r.allergy_warnings?.length > 0 && (
                      <div className="mt-2 text-xs text-red-600">
                        {r.allergy_warnings.map((w, i) => (
                          <span key={i}>
                            {w.emoji} {w.title}
                            {i < r.allergy_warnings.length - 1 ? ' · ' : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    {r.headline && (
                      <p className="mt-2 text-sm text-gray-600">{r.headline}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
