# Monster Generator

An AI-powered web tool for generating custom demon configurations for DOOM-style FPS games. This tool uses natural language descriptions to create JSON monster configurations that can be directly imported into your game.

## Features

- 🤖 **AI-Powered Generation**: Uses OpenSota AI to generate monsters from natural language descriptions
- 🎮 **Game-Ready Output**: Generates JSON configurations compatible with the game's demon system
- 🎨 **Visual Preview**: See monster stats, colors, and abilities before export
- 📁 **Export/Import**: Easy JSON file export and clipboard copying
- 🔒 **Secure API**: API keys are handled server-side for security
- ⚡ **Fast & Modern**: Built with Next.js 14 and Tailwind CSS

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your OpenSota API key:

   ```
   OPENSOTA_API_KEY=os_your_api_key_here
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3001`

## Getting an API Key

1. Visit [OpenSota AI](https://opensota.ai)
2. Sign up for an account
3. Get your API key from the dashboard
4. Add it to your `.env.local` file

## Usage

1. **Describe Your Monster**: Enter a natural language description of the monster you want to create
2. **Generate**: Click the generate button or use Cmd/Ctrl + Enter
3. **Review**: Check the generated monster's stats, colors, and abilities
4. **Export**: Copy the JSON to clipboard or download as a file
5. **Import to Game**: Use the JSON in your game's demon manager

### Sample Prompts

- "A fierce fire dragon with massive wings and breath attacks"
- "A shadowy assassin demon with teleportation abilities"
- "A heavily armored tank demon with devastating melee attacks"
- "A flying ice demon that shoots freezing projectiles"
- "A small but fast poison demon with toxic abilities"

## JSON Output Format

The generated JSON follows the game's demon configuration format:

```json
{
  "id": "unique_demon_id",
  "name": "Demon Name",
  "emoji": "👹",
  "description": "Brief description",
  "health": 50,
  "speed": 1.5,
  "scale": 1.0,
  "colors": {
    "primary": "#ff0000",
    "head": "#cc0000",
    "eyes": "#ffff00"
  },
  "behavior": {
    "detectRange": 15,
    "attackRange": 5,
    "chaseRange": 20,
    "attackDamage": 25,
    "spawnWeight": 10
  },
  "appearance": {
    "bodyType": "humanoid",
    "visualFeatures": {
      "hasWings": false,
      "hasTail": true,
      "hasHorns": true
    }
  },
  "themes": {
    "hell": { "primary": "#ff0000" },
    "ice": { "primary": "#00aaff" },
    "toxic": { "primary": "#00ff00" },
    "industrial": { "primary": "#666666" }
  }
}
```

## Development

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom gaming theme
- **Language**: TypeScript
- **AI Provider**: OpenSota AI (GLM-4.5-Air model)

### Scripts

- `npm run dev` - Start development server (port 3001)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Security

- API keys are stored server-side only
- No client-side API key exposure
- Environment variables for configuration
- Input validation and sanitization

## Integration

The generated JSON files can be directly imported into the game's demon manager:

1. In-game, press ESC to enter pause menu
2. Click "📝 Manage Custom Demons"
3. Switch to "📥 Import" tab
4. Paste the generated JSON
5. Click "Validate" then "Import"

## License

This project is part of the open-source DOOM-style FPS game project.
