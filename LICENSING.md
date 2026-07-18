# Bible Text Licensing

Bible Presenter fetches configured translations (currently **TB**, **NKJV**, and **NIV**) at runtime primarily from the [Mayicu Alkitab API](https://mayicu.id/api/alkitab/v1/docs). If Mayicu fails or returns incomplete data, the app falls back to the [alkitab-api](https://github.com/sonnylazuardi/alkitab-api) GraphQL service ([bible.sonnylab.com](https://bible.sonnylab.com)), which sources text from [Alkitab Mobile SABDA](http://alkitab.mobi/). Chapters are cached locally in SQLite after the first successful load.

## Development and personal use

- No API key is required for Mayicu or the hosted alkitab-api endpoint.
- Follow the terms of Mayicu, alkitab-api, and SABDA for how you access and use the text.
- TB, NKJV, and NIV are copyrighted translations. Each additional version may have different terms; do not bundle, redistribute, or republish verse text outside what its source and rights holder allow.

## Distribution

If you ship this app publicly, make sure every enabled translation complies with:

1. **Mayicu API terms** — for primary live fetching and caching behavior in the app.
2. **alkitab-api / SABDA terms** — for fallback fetching and caching behavior.
3. **Copyright law and translation-specific terms** — these translations are not public domain.

Do not ship installers or public builds that embed large amounts of copyrighted Bible text unless you have the right to redistribute it.
