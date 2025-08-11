
# OPEX Portal

React single-page app ready for Netlify.

## Deploy (Netlify)
1. Create a new site on Netlify and choose **Import from Git** or **Deploy manually**.
2. If from Git, push these files and set:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: 18 (already in `netlify.toml`)
3. For manual deploy with build, run locally:
   ```bash
   npm ci
   npm run build
   ```
   Then upload the generated `build/` folder to Netlify.
