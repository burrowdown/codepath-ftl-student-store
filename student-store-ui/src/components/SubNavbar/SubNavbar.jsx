import "./SubNavbar.css"

function SubNavbar({ activeCategory, setActiveCategory, searchInputValue, handleOnSearchInputChange, sortBy, setSortBy }) {


  const categories = [
    { label: "All Categories", value: "All Categories" },
    { label: "Accessories", value: "ACCESSORIES" },
    { label: "Apparel", value: "APPAREL" },
    { label: "Books", value: "BOOKS" },
    { label: "Snacks", value: "SNACKS" },
    { label: "Supplies", value: "SUPPLIES" },
  ];

  return (
    <nav className="SubNavbar">

      <div className="content">

        <div className="row">
          <div className="search-bar">
            <input
              type="text"
              name="search"
              placeholder="Search"
              value={searchInputValue}
              onChange={handleOnSearchInputChange}
            />
            <i className="material-icons">search</i>
          </div>
          <div className="sort-control">
            <label htmlFor="sort-by">Sort by</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">Default</option>
              <option value="price">Price (low to high)</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>

        <div className="row">
          <ul className={`category-menu`}>
            {categories.map((cat) => (
              <li className={activeCategory === cat.value ? "is-active" : ""} key={cat.value}>
                <button onClick={() => setActiveCategory(cat.value)}>{cat.label}</button>
              </li>
            ))}
          </ul>
        </div>
        
      </div>
    </nav>
  )
}

export default SubNavbar;