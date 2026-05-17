# Usage Guide

Using the AI SEO Article Generator is simple and intuitive.

## Generating an Article

1. Start both the backend and frontend servers as described in the [Setup Guide](SETUP.md).
2. Open the application in your browser.
3. In the main input field, enter your target keyword (e.g., "Best smart home devices 2024").
4. Click the **Generate SEO Article** button.
5. The application will show a loading state while it communicates with the OpenAI API.
6. Once generated, the results will appear below the input field.

## Reviewing the Results

The results are split into two sections:

- **Generated Article (Main Section)**: Displays the SEO-optimized Title, Meta Description, and the full Markdown-formatted article content.
- **Sidebar**: Displays your original Target Keyword and a list of 5 to 10 suggested LSI and long-tail keywords to further optimize your SEO strategy.

## Copying Content

You can easily copy the generated content by clicking the **Copy All** button in the top right corner of the Generated Article section. This will copy the title, meta description, content, and suggested keywords to your clipboard, ready to be pasted into your CMS (e.g., WordPress, Ghost).

## Saving to Database

By default, every successfully generated article is saved to your MongoDB database. You can build out the "History" tab in the frontend by calling the \`/api/history\` endpoint to view past generations.
