import { Link } from "react-router-dom";

/**
 * Renders a list of RestaurantResult objects from the Kairos Agent.
 * Each card shows allergy warnings inline (never hidden).
 */
const RestaurantList = ({ restaurants }) => {
  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No restaurants found matching your criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {restaurants.map((r) => {
        const vibeTags = (r.meta?.vibe_tags) ?? [];
        const dietaryOptions = (r.meta?.dietary_options) ?? [];

        return (
          <div
            key={r.id}
            className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{r.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  {r.area && <span>📍 {r.area}</span>}
                  {r.price_tier && <span>{r.price_tier}</span>}
                  {r.rating != null && <span>⭐ {r.rating}</span>}
                  {r.votes > 0 && <span>({r.votes} votes)</span>}
                </div>
              </div>
              {r.allergy_safe && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  🛡️ Allergy Safe
                </span>
              )}
            </div>

            {/* Cuisine tags */}
            {r.cuisine_types?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {r.cuisine_types.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200"
                  >
                    🍽️ {c}
                  </span>
                ))}
                {vibeTags.slice(0, 3).map((v, i) => (
                  <span
                    key={`v-${i}`}
                    className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200"
                  >
                    ✨ {v}
                  </span>
                ))}
                {dietaryOptions.slice(0, 2).map((d, i) => (
                  <span
                    key={`d-${i}`}
                    className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200"
                  >
                    🌱 {d}
                  </span>
                ))}
              </div>
            )}

            {/* Allergy warnings — NEVER hide these */}
            {r.allergy_warnings?.length > 0 && (
              <div className="mt-3 space-y-1">
                {r.allergy_warnings.map((w, i) => (
                  <div
                    key={i}
                    className={`text-sm flex items-start gap-1 ${
                      w.level === "danger"
                        ? "text-red-700"
                        : w.level === "warning"
                        ? "text-orange-700"
                        : w.level === "caution"
                        ? "text-yellow-700"
                        : "text-blue-700"
                    }`}
                  >
                    <span>{w.emoji}</span>
                    <span>
                      <strong>{w.title}</strong> — {w.message}
                      {w.confidence_note && (
                        <span className="text-gray-500 italic ml-1">
                          ({w.confidence_note})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Link to detail */}
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View details →
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RestaurantList;
