/**
 * Placeholder map view for restaurant locations.
 * Shows restaurant pins as styled cards since we don't have a real map library.
 */
const ChatMapView = ({ restaurants }) => {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="bg-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="text-center text-sm text-gray-500 mb-4">
          🗺️ Map View — Restaurant Locations
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex items-start gap-2"
            >
              <span className="text-xl">📍</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {r.name}
                </p>
                {r.area && (
                  <p className="text-xs text-gray-500 truncate">{r.area}</p>
                )}
                {r.cuisine_types?.length > 0 && (
                  <p className="text-xs text-gray-400 truncate">
                    {r.cuisine_types.join(", ")}
                  </p>
                )}
                {r.allergy_warnings?.length > 0 && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {r.allergy_warnings.map((w) => w.emoji).join(" ")}{" "}
                    Allergy alerts
                  </p>
                )}
              </div>
              {r.rating != null && (
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                  ⭐ {r.rating}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatMapView;
