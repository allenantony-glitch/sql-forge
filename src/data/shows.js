// ============================================================
// SEED DATA — the streaming-platform "shows" table (15 rows)
// ============================================================

export const SHOWS_DATA = [
  { id: 1,  name: "Breaking Bad",     genre: "Crime",   imdb_rating: 9.5, certificate: "A",     premiere_year: 2008, finale_year: 2013, episode_count: 62,  overview: "A chemistry teacher turns to cooking meth to secure his family's future." },
  { id: 2,  name: "Game of Thrones",  genre: "Fantasy", imdb_rating: 9.2, certificate: "A",     premiere_year: 2011, finale_year: 2019, episode_count: 73,  overview: "Noble families vie for the Iron Throne of Westeros." },
  { id: 3,  name: "The Office",       genre: "Comedy",  imdb_rating: 8.9, certificate: "PG-13", premiere_year: 2005, finale_year: 2013, episode_count: 201, overview: "A mockumentary about office workers at a paper company." },
  { id: 4,  name: "Stranger Things",  genre: "Sci-Fi",  imdb_rating: 8.7, certificate: "PG-13", premiere_year: 2016, finale_year: null, episode_count: 34,  overview: "Kids in a small town confront supernatural forces." },
  { id: 5,  name: "The Wire",         genre: "Crime",   imdb_rating: 9.3, certificate: "A",     premiere_year: 2002, finale_year: 2008, episode_count: 60,  overview: "Baltimore through the eyes of cops and criminals." },
  { id: 6,  name: "Friends",          genre: "Comedy",  imdb_rating: 8.9, certificate: "PG",    premiere_year: 1994, finale_year: 2004, episode_count: 236, overview: "Six friends navigate life and love in New York City." },
  { id: 7,  name: "The Crown",        genre: "Drama",   imdb_rating: 8.6, certificate: "PG-13", premiere_year: 2016, finale_year: 2023, episode_count: 60,  overview: "The reign of Queen Elizabeth II from the 1940s onward." },
  { id: 8,  name: "Better Call Saul", genre: "Crime",   imdb_rating: 8.9, certificate: "A",     premiere_year: 2015, finale_year: 2022, episode_count: 63,  overview: "The transformation of a small-time lawyer into Saul Goodman." },
  { id: 9,  name: "Severance",        genre: "Sci-Fi",  imdb_rating: 8.7, certificate: "PG-13", premiere_year: 2022, finale_year: null, episode_count: 18,  overview: "Employees surgically split their work and home memories." },
  { id: 10, name: "Succession",       genre: "Drama",   imdb_rating: 8.8, certificate: "R",     premiere_year: 2018, finale_year: 2023, episode_count: 39,  overview: "A media dynasty fights over the family empire's future." },
  { id: 11, name: "Chernobyl",        genre: "Drama",   imdb_rating: 9.3, certificate: "R",     premiere_year: 2019, finale_year: 2019, episode_count: 5,   overview: "The 1986 nuclear disaster and its terrible aftermath." },
  { id: 12, name: "Sherlock",         genre: "Mystery", imdb_rating: 9.1, certificate: "PG-13", premiere_year: 2010, finale_year: 2017, episode_count: 15,  overview: "A modern update to Sir Arthur Conan Doyle's classic detective." },
  { id: 13, name: "The Mandalorian",  genre: "Sci-Fi",  imdb_rating: 8.5, certificate: "PG",    premiere_year: 2019, finale_year: null, episode_count: 24,  overview: "A bounty hunter protects a mysterious child across the galaxy." },
  { id: 14, name: "The Walking Dead", genre: "Horror",  imdb_rating: 8.1, certificate: "R",     premiere_year: 2010, finale_year: 2022, episode_count: 177, overview: "Survivors of a zombie apocalypse fight to stay alive." },
  { id: 15, name: "Lost",             genre: "Mystery", imdb_rating: 8.3, certificate: "PG-13", premiere_year: 2004, finale_year: 2010, episode_count: 121, overview: "Plane crash survivors uncover the mysteries of a strange island." },
];

export const EPISODES_DATA = [
  { id: 1,  show_id: 1,  season: 1, episode: 1,  title: "Pilot",                       air_date: "2008-01-20", runtime_min: 58, rating: 8.9 },
  { id: 2,  show_id: 1,  season: 1, episode: 2,  title: "Cat's in the Bag",            air_date: "2008-01-27", runtime_min: 48, rating: 8.5 },
  { id: 3,  show_id: 1,  season: 5, episode: 16, title: "Felina",                      air_date: "2013-09-29", runtime_min: 55, rating: 9.9 },
  { id: 4,  show_id: 2,  season: 1, episode: 1,  title: "Winter Is Coming",            air_date: "2011-04-17", runtime_min: 62, rating: 9.1 },
  { id: 5,  show_id: 2,  season: 8, episode: 6,  title: "The Iron Throne",             air_date: "2019-05-19", runtime_min: 80, rating: 4.1 },
  { id: 6,  show_id: 3,  season: 1, episode: 1,  title: "Pilot",                       air_date: "2005-03-24", runtime_min: 23, rating: 7.6 },
  { id: 7,  show_id: 3,  season: 7, episode: 15, title: "Finale",                      air_date: "2013-05-16", runtime_min: 50, rating: 9.7 },
  { id: 8,  show_id: 4,  season: 1, episode: 1,  title: "Chapter One",                 air_date: "2016-07-15", runtime_min: 48, rating: 8.6 },
  { id: 9,  show_id: 5,  season: 1, episode: 1,  title: "The Target",                  air_date: "2002-06-02", runtime_min: 59, rating: 9.0 },
  { id: 10, show_id: 6,  season: 1, episode: 1,  title: "The Pilot",                   air_date: "1994-09-22", runtime_min: 22, rating: 8.3 },
  { id: 11, show_id: 9,  season: 1, episode: 1,  title: "Good News About Hell",        air_date: "2022-02-18", runtime_min: 57, rating: 8.3 },
  { id: 12, show_id: 10, season: 1, episode: 1,  title: "Celebration",                 air_date: "2018-06-03", runtime_min: 63, rating: 7.9 },
  { id: 13, show_id: 11, season: 1, episode: 1,  title: "1:23:45",                     air_date: "2019-05-06", runtime_min: 66, rating: 9.4 },
  { id: 14, show_id: 11, season: 1, episode: 5,  title: "Vichnaya Pamyat",             air_date: "2019-06-03", runtime_min: 72, rating: 9.7 },
  { id: 15, show_id: 12, season: 1, episode: 1,  title: "A Study in Pink",             air_date: "2010-07-25", runtime_min: 88, rating: 9.2 },
  { id: 16, show_id: 8,  season: 1, episode: 1,  title: "Uno",                         air_date: "2015-02-08", runtime_min: 53, rating: 8.2 },
  { id: 17, show_id: 7,  season: 1, episode: 1,  title: "Wolferton Splash",            air_date: "2016-11-04", runtime_min: 57, rating: 8.3 },
  { id: 18, show_id: 13, season: 1, episode: 1,  title: "Chapter 1: The Mandalorian",  air_date: "2019-11-12", runtime_min: 39, rating: 8.7 },
  { id: 19, show_id: 14, season: 1, episode: 1,  title: "Days Gone Bye",               air_date: "2010-10-31", runtime_min: 67, rating: 9.2 },
  { id: 20, show_id: 15, season: 1, episode: 1,  title: "Pilot",                       air_date: "2004-09-22", runtime_min: 73, rating: 8.7 },
];

// Some shows deliberately have no reviews — this powers the LEFT JOIN /
// "find the ghosts" challenges in Layer 3. Shows WITHOUT reviews:
//   4 (Stranger Things), 6 (Friends), 7 (The Crown), 9 (Severance),
//   13 (Mandalorian), 14 (Walking Dead), 15 (Lost)  → 7 orphans
export const REVIEWS_DATA = [
  { id: 1,  show_id: 1,  viewer: "alice",   rating: 10, review: "Perfect finale" },
  { id: 2,  show_id: 1,  viewer: "bob",     rating: 9,  review: "Incredible character development" },
  { id: 3,  show_id: 2,  viewer: "alice",   rating: 8,  review: "Great until season 8" },
  { id: 4,  show_id: 2,  viewer: "charlie", rating: 7,  review: "Disappointing ending" },
  { id: 5,  show_id: 3,  viewer: "bob",     rating: 9,  review: "Endlessly rewatchable" },
  { id: 6,  show_id: 5,  viewer: "diana",   rating: 10, review: "The greatest TV show ever made" },
  { id: 7,  show_id: 8,  viewer: "alice",   rating: 9,  review: "Slow burn perfection" },
  { id: 8,  show_id: 11, viewer: "charlie", rating: 10, review: "Haunting and important" },
  { id: 9,  show_id: 12, viewer: "diana",   rating: 9,  review: "Brilliant mysteries" },
  { id: 10, show_id: 10, viewer: "bob",     rating: 9,  review: "Sharp writing throughout" },
];

export const TABLES = { shows: SHOWS_DATA, episodes: EPISODES_DATA, reviews: REVIEWS_DATA };

export const SHOW_COLUMN_ORDER    = ["id", "name", "genre", "imdb_rating", "certificate", "premiere_year", "finale_year", "episode_count", "overview"];
export const EPISODE_COLUMN_ORDER = ["id", "show_id", "season", "episode", "title", "air_date", "runtime_min", "rating"];
export const REVIEW_COLUMN_ORDER  = ["id", "show_id", "viewer", "rating", "review"];

// Lookup used by the engine (bind / join construction) and by the multi-table
// source display in the UI.
export const TABLE_COLUMN_ORDER = {
  shows:    SHOW_COLUMN_ORDER,
  episodes: EPISODE_COLUMN_ORDER,
  reviews:  REVIEW_COLUMN_ORDER,
};
