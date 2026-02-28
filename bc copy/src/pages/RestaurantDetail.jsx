import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth, recommendations } from '../lib/kairosClient';
import AllergyDangerBanner from '../components/AllergyDangerBanner';

const RestaurantDetail = () => {
  const { id } = useParams();
  const uid = auth.getUid();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid || !id) return;
    setLoading(true);
    recommendations
      .expand(uid, id)
      .then((data) => setDetail(data))
      .catch((err) => setError(err?.detail || 'Failed to load restaurant details'))
      .finally(() => setLoading(false));
  }, [uid, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/results" className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Results
            </Link>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Restaurant not found'}
          </h2>
          <Link to="/results" className="text-primary-600 hover:text-primary-700 font-semibold">
            Back to results
          </Link>
        </div>
      </div>
    );
  }

  const restaurant = detail.restaurant ?? detail;
  const expanded = detail.expanded ?? detail;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/results"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Results
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                {restaurant.area && <span>📍 {restaurant.area}</span>}
                {restaurant.rating != null && (
                  <span className="flex items-center gap-1">
                    ⭐ {restaurant.rating}
                    {restaurant.votes > 0 && <span className="text-sm">({restaurant.votes})</span>}
                  </span>
                )}
                {restaurant.price_tier && <span>{restaurant.price_tier}</span>}
              </div>
            </div>
            {restaurant.fit_score != null && (
              <div className={`text-center px-4 py-2 rounded-xl ${
                restaurant.fit_score >= 80
                  ? 'bg-green-50 border-2 border-green-200'
                  : restaurant.fit_score >= 60
                  ? 'bg-amber-50 border-2 border-amber-200'
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}>
                <div className="text-3xl font-bold">{restaurant.fit_score}%</div>
                <div className="text-xs text-gray-500">AI Fit</div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {restaurant.cuisine_types?.map((c, i) => (
              <span key={i} className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm border border-amber-200">
                🍽️ {c}
              </span>
            ))}
            {restaurant.meta?.vibe_tags?.map((v, i) => (
              <span key={`v-${i}`} className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-sm border border-violet-200">
                ✨ {v}
              </span>
            ))}
            {restaurant.meta?.dietary_options?.map((d, i) => (
              <span key={`d-${i}`} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm border border-emerald-200">
                🌱 {d}
              </span>
            ))}
            {restaurant.allergy_safe && (
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200">
                🛡️ Allergy Safe
              </span>
            )}
          </div>

          {/* Allergy warnings — NEVER hide */}
          {restaurant.allergy_warnings?.length > 0 && (
            <div className="mt-4">
              <AllergyDangerBanner flagged={[restaurant]} />
            </div>
          )}
        </div>

        {/* AI Summary */}
        {expanded.summary && (
          <div className="bg-gradient-to-br from-primary-50 to-yellow-50 rounded-2xl p-8 shadow-lg border-2 border-primary-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-primary-500 to-yellow-500 p-3 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Summary</h2>
                <p className="text-sm text-gray-600">Personalized insights for you</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">{expanded.summary}</p>
          </div>
        )}

        {/* Highlights */}
        {expanded.highlights?.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Highlights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {expanded.highlights.map((highlight, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-primary-500 to-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-700">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Picks */}
        {expanded.menu_picks?.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🍽️ Recommended Dishes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {expanded.menu_picks.map((dish, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="font-semibold text-gray-900">{dish.name || dish}</p>
                  {dish.description && (
                    <p className="text-sm text-gray-600 mt-1">{dish.description}</p>
                  )}
                  {dish.price && (
                    <p className="text-sm font-medium text-primary-600 mt-1">{dish.price}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence note */}
        {expanded.confidence_note && (
          <p className="text-sm text-gray-500 italic text-center">{expanded.confidence_note}</p>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex flex-wrap gap-4">
            {restaurant.url && (
              <a
                href={restaurant.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>View on Source</span>
              </a>
            )}
            <button className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-4 rounded-xl font-semibold border-2 border-gray-300 hover:border-primary-400 transition-all flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;
