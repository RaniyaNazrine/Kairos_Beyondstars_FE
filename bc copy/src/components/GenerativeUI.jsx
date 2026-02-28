/**
 * GenerativeUI — Renders the appropriate component based on the ui_type
 * returned by the Kairos Agent /chat SSE stream result event.
 *
 * SAFETY: flagged_restaurants are always rendered prominently via AllergyDangerBanner.
 */
import AllergyDangerBanner from "./AllergyDangerBanner";
import RestaurantList from "./RestaurantList";
import RadarComparison from "./RadarComparison";
import ChatMapView from "./ChatMapView";
import TextResponse from "./TextResponse";

const GenerativeUI = ({ payload, onFollowUp }) => {
  if (!payload) return null;

  return (
    <div>
      {/* Agent message */}
      <p className="text-gray-700 leading-relaxed mb-4">{payload.message}</p>

      {/* ALWAYS render allergy warning banner when flagged restaurants exist */}
      {payload.flagged_restaurants?.length > 0 && (
        <AllergyDangerBanner restaurants={payload.flagged_restaurants} />
      )}

      {/* Render the correct UI component based on ui_type */}
      {payload.ui_type === "restaurant_list" && (
        <RestaurantList restaurants={payload.restaurants} />
      )}
      {payload.ui_type === "radar_comparison" && (
        <RadarComparison restaurants={payload.restaurants} />
      )}
      {payload.ui_type === "map_view" && (
        <ChatMapView
          restaurants={payload.restaurants}
          center={payload.map_center}
        />
      )}
      {payload.ui_type === "text" && (
        <TextResponse
          text={payload.message}
          follow_up_questions={payload.follow_up_questions}
          onFollowUp={onFollowUp}
        />
      )}
    </div>
  );
};

export default GenerativeUI;
