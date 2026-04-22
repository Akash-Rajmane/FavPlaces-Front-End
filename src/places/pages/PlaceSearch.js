import { liteClient as algoliasearch } from "algoliasearch/lite";
import {
  InstantSearch,
  SearchBox,
  useHits,
  Highlight,
} from "react-instantsearch";
import { Link } from "react-router-dom";
import Masonry from "react-masonry-css";
import "./PlaceSearch.css";

const searchClient = algoliasearch(
  `${process.env.REACT_APP_ALGOLIA_APP_ID}`,
  `${process.env.REACT_APP_ALGOLIA_SEARCH_ONLY_KEY}`,
);

const searchBoxClassNames = {
  root: "place-search__search-root",
  form: "place-search__search-form",
  input: "place-search__search-input",
  submit: "place-search__search-submit",
  reset: "place-search__search-reset",
  resetIcon: "place-search__search-reset-icon",
  loadingIndicator: "place-search__search-loading",
};

const highlightClassNames = {
  root: "place-search__highlight-root",
  highlighted: "place-search__highlight",
  nonHighlighted: "place-search__highlight-muted",
};

function Hit({ hit }) {
  return (
    <Link to={`/place/${hit.objectID}`} className="place-search__hit-card">
      {hit.image ? (
        <div className="place-search__hit-media">
          <img src={hit.image} alt={hit.title || ""} />
        </div>
      ) : (
        <div
          className="place-search__hit-media place-search__hit-media--placeholder"
          aria-hidden
        >
          📍
        </div>
      )}
      <div className="place-search__hit-body">
        <p className="place-search__hit-title">
          <Highlight
            attribute="title"
            hit={hit}
            classNames={highlightClassNames}
          />
        </p>
        {hit.address ? (
          <p className="place-search__hit-address">{hit.address}</p>
        ) : null}
        {hit.vibe ? (
          <span className="place-search__hit-vibe">{hit.vibe}</span>
        ) : null}
      </div>
    </Link>
  );
}

function CustomHits(props) {
  const { hits } = useHits(props);
  const breakpointColumnsObj = {
    default: 3,
    1024: 3,
    768: 2,
    500: 1
  };

  if (hits.length === 0) {
    return (
      <p className="place-search__empty">
        No places found.
      </p>
    );
  }

  return (
    <div className="place-search__hits">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="place-search-masonry"
        columnClassName="place-search-masonry_column"
      >
        {hits.map(hit => (
          <Hit key={hit.objectID} hit={hit} />
        ))}
      </Masonry>
    </div>
  );
}

export default function PlaceSearch() {
  return (
    <div className="place-search">
      <div className="place-search__inner">
        <header className="place-search__intro">
          <p className="place-search__eyebrow">Explore</p>
          <h1 className="place-search__title">Find your next favorite place</h1>
          <p className="place-search__subtitle">
            Search spots people love — cafés, views, hidden gems, and more.
          </p>
        </header>

        <InstantSearch
          searchClient={searchClient}
          indexName="places"
          stalledSearchDelay={600000}
        >
          <SearchBox
            placeholder="Search by name, area, or vibe…"
            classNames={searchBoxClassNames}
          />
          <CustomHits />
        </InstantSearch>
      </div>
    </div>
  );
}
