# Bible Text Licensing

Bible Presenter uses **Terjemahan Baru (TB)** verse text fetched at runtime from the [mayicu Alkitab API](https://mayicu.id/api/alkitab/v1/docs). Chapters are cached locally in SQLite after the first successful load.

## Development and personal use

- No API key is required for mayicu.
- Follow the mayicu API terms of use for how you access and use the text.
- TB remains a copyrighted translation — do not bundle, redistribute, or republish verse text outside what the API allows.

## Distribution

If you ship this app publicly, make sure your use of TB text complies with:

1. **mayicu API terms** — for live fetching and caching behavior in the app.
2. **Copyright law** — TB text is not public domain.

Do not ship installers or public builds that embed large amounts of TB text unless you have the right to redistribute it.
