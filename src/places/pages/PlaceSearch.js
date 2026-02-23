import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearch, SearchBox, Hits, Highlight } from "react-instantsearch";
import { useNavigate } from "react-router-dom";

const searchClient = algoliasearch(
  `${process.env.REACT_APP_ALGOLIA_APP_ID}`,
  `${process.env.REACT_APP_ALGOLIA_SEARCH_ONLY_KEY}`,
);

function Hit({ hit }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/place/${hit.objectID}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        gap: "10px",
        padding: "10px",
        cursor: "pointer",
        borderBottom: "1px solid #eee",
      }}
    >
      {hit.image && (
        <img
          src={hit.image}
          alt={hit.title}
          width="60"
          height="60"
          style={{ objectFit: "cover", borderRadius: "8px" }}
        />
      )}

      <div>
        <h4>
          <Highlight attribute="title" hit={hit} />
        </h4>
        <p>{hit.address}</p>
        <small>{hit.vibe}</small>
      </div>
    </div>
  );
}

export default function PlaceSearch() {
  return (
    <InstantSearch searchClient={searchClient} indexName="places">
      <SearchBox placeholder="Search places..." />
      <Hits hitComponent={Hit} />
    </InstantSearch>
  );
}
