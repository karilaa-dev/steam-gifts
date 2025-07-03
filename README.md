# 🎮 Steam Wishlist Review

A modern web application for reviewing friends' Steam wishlists with multi-region price comparison. Built with React, Bun, and TypeScript.

![Steam Wishlist Review](https://img.shields.io/badge/Steam-API-blue) ![React](https://img.shields.io/badge/React-19-blue) ![Bun](https://img.shields.io/badge/Bun-Runtime-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

- **🔍 Steam ID Support**: Enter Steam ID64 or Steam profile URLs
- **👥 Friends Integration**: Login to view private wishlists of friends
- **🌍 Multi-Region Pricing**: Compare game prices across different regions (US, EU, Russia, etc.)
- **📊 Wishlist Ordering**: Games displayed in original wishlist order
- **🎯 Search & Filtering**: Search games and sort by name, price, or wishlist position
- **💰 Discount Highlighting**: Clearly shows discounted prices and savings
- **📱 Responsive Design**: Works on desktop and mobile devices
- **⚡ Fast Performance**: Built with Bun runtime for optimal speed

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Steam Web API Key](https://steamcommunity.com/dev/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd steam-gifts
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure Steam API Key**
   ```bash
   # Copy the example config
   cp config.example.ts config.ts
   
   # Edit config.ts and add your Steam Web API key
   # Get your key from: https://steamcommunity.com/dev/apikey
   ```

4. **Start the development server**
   ```bash
   # Start the full-stack application (frontend + backend)
   bun run dev
   ```

5. **Open your browser**
   - Application: http://localhost:3000
   - API endpoints: http://localhost:3000/api/*

## 🛠️ Configuration

### Steam API Setup

1. Go to [Steam Web API Key](https://steamcommunity.com/dev/apikey)
2. Register your application
3. Copy the API key to `config.ts`:

```typescript
export const config = {
  steamApiKey: 'YOUR_STEAM_API_KEY_HERE',
  // ... other settings
};
```

### Regional Pricing

Customize which regions to compare in `config.ts`:

```typescript
priceRegions: ['US', 'EU', 'RU', 'UK', 'CA', 'AU'], // Add/remove regions
regionNames: {
  'US': 'United States',
  'EU': 'European Union',
  'RU': 'Russia',
  // ... add custom region names
}
```

## 📖 Usage

### Method 1: Direct Steam ID

1. Enter a Steam ID64 (e.g., `76561198123456789`)
2. Or paste a Steam profile URL (e.g., `https://steamcommunity.com/profiles/76561198123456789`)
3. Click "View Wishlist" to see their public wishlist

### Method 2: Friends List

1. Enter your own Steam ID
2. Check "Load friends list"
3. Select a friend from the list
4. View their wishlist (works for private profiles if you're friends)

### Features in Wishlist View

- **🔍 Search**: Filter games by name
- **📊 Sort Options**: 
  - Wishlist Order (original Steam ordering)
  - Name (A-Z)
  - Price (Low to High)
- **💰 Price Comparison**: See prices across multiple regions
- **🏷️ Discount Alerts**: Highlighted discounts and savings
- **🔗 Steam Links**: Direct links to Steam store pages

## 🏗️ Project Structure

```
steam-gifts/
├── src/
│   ├── server/           # Backend API
│   │   ├── steam-api.ts  # Steam Web API integration
│   │   └── index.ts      # Bun.serve() server with routes
│   ├── client/           # React frontend
│   │   ├── components/   # React components
│   │   │   ├── SteamIdInput.tsx
│   │   │   ├── FriendSelector.tsx
│   │   │   └── WishlistViewer.tsx
│   │   ├── App.tsx       # Main React app
│   │   ├── App.css       # Styles
│   │   └── main.tsx      # React entry point
│   └── types/            # TypeScript definitions
│       └── steam.ts      # Steam API types
├── index.html            # HTML template with React imports
├── index.ts              # Main server entry point
├── config.ts             # Configuration file
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🔧 API Endpoints

### Backend API Routes

- `GET /api/health` - Health check
- `GET /api/user/:steamId` - Get user information
- `GET /api/friends/:steamId` - Get friends list
- `GET /api/wishlist/:steamId` - Get wishlist with regional pricing
- `POST /api/validate-steam-id` - Validate and extract Steam ID
- `GET /api/regions` - Get available regions

### Example API Usage

```bash
# Get wishlist with custom regions
curl "http://localhost:3000/api/wishlist/76561198123456789?regions=US,EU,RU"

# Validate Steam ID
curl -X POST http://localhost:3000/api/validate-steam-id \
  -H "Content-Type: application/json" \
  -d '{"input": "https://steamcommunity.com/profiles/76561198123456789"}'
```

## 🚦 Available Scripts

```bash
# Development
bun run dev          # Start full-stack app with hot reload (frontend + backend)

# Production
bun run build        # Build application for production
bun run start        # Start production server

# Testing
bun test            # Run tests with Bun's built-in test runner
```

## 🔒 Privacy & Rate Limiting

- **Public Wishlists**: Accessible without authentication
- **Private Wishlists**: Requires being friends with the user
- **Rate Limiting**: Steam API calls are automatically throttled
- **No Data Storage**: User data is not stored on the server

## 🛡️ Error Handling

The application handles various error scenarios:

- **Invalid Steam IDs**: Clear error messages with suggestions
- **Private Profiles**: Informative messages about privacy settings
- **API Rate Limits**: Automatic retry mechanisms
- **Network Issues**: Graceful degradation and error recovery

## 🎨 Customization

### Styling

Modify `src/client/App.css` to customize the appearance:

```css
/* Change color scheme */
:root {
  --primary-color: #1e3c72;
  --secondary-color: #2a5298;
  --accent-color: #4fc3f7;
}
```

### Adding New Regions

1. Update `config.ts` with new region codes
2. Add region names to the `regionNames` object
3. The Steam API will automatically fetch prices for the new regions

## 🐛 Troubleshooting

### Common Issues

1. **"Steam API key not set"**
   - Make sure you've created `config.ts` from `config.example.ts`
   - Verify your Steam API key is correct

2. **"Wishlist is private or user not found"**
   - The user's wishlist is private
   - Try using the friends list method if you're friends with them
   - Verify the Steam ID is correct (17 digits starting with 7656119)

3. **"Failed to parse JSON" or "SyntaxError: Failed to parse JSON"**
   - This usually means the wishlist is private or the Steam ID is invalid
   - Steam returns HTML error pages instead of JSON for private/invalid profiles
   - The app now handles this gracefully with better error messages

4. **"Failed to load friends"**
   - The user's friends list is private
   - Steam API may be temporarily unavailable

5. **Rate limiting errors**
   - The application automatically handles Steam's rate limits
   - Try again in a few moments

6. **"Cannot access localhost:3000"**
   - Make sure you're running `bun run dev`
   - Check if another application is using port 3000

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=true bun run dev
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Steam Web API](https://steamcommunity.com/dev) for providing the data
- [Bun](https://bun.sh/) for the amazing JavaScript runtime
- [Hono](https://hono.dev/) for the lightweight web framework
- [React](https://react.dev/) for the frontend framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [GitHub issues](../../issues)
3. Create a new issue with detailed information

---

**Happy gaming! 🎮**
