# 🔥 DOOM Protocol - LAN Multiplayer Setup Guide 🔥

## 🌐 Overview

This guide will help you set up LAN (Local Area Network) multiplayer games for DOOM Protocol, allowing multiple players on the same network to battle demons together!

## 🖥️ Server Setup (Host)

### Prerequisites
- Node.js (version 16 or higher)
- All players must be on the same network (WiFi/Ethernet)

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm run build
npm start
```

### Step 3: Find Your IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address under your active network interface

**The server will also display your IP when it starts:**
```
✅ Doom Protocol Server listening on 0.0.0.0:3000
🏠 Your LAN IP(s): 192.168.1.100
🎮 Players can connect to: http://192.168.1.100:3000
```

## 🎮 Client Setup (Players)

### Step 1: Open the Game
Navigate to the game folder and serve the client:
```bash
cd client
python3 -m http.server 8080
# Or use any other web server
```

### Step 2: Connect to Multiplayer
1. Open your browser and go to `http://localhost:8080`
2. Click "🎮 ENTER HELL (MULTIPLAYER)"
3. In the "🌐 SERVER CONNECTION" section:
   - Select "🌐 LAN Server"
   - Enter the host's IP address and port (e.g., `192.168.1.100:3000`)
   - Click "🔗 CONNECT TO HELL"

### Step 3: Join or Create Rooms
- **Create Room**: Enter your demon name, create a chamber, and wait for others
- **Join Room**: Enter your demon name, refresh chambers, and join an existing one

## 🔧 Configuration Options

### Server Connection Types

1. **🏠 Local Server** (`localhost:3000`)
   - For testing on the same machine
   - Automatically connects when selected

2. **🌐 LAN Server** 
   - For players on the same network
   - Enter host IP:port (e.g., `192.168.1.100:3000`)

3. **⚙️ Custom Server**
   - For advanced setups or remote servers
   - Enter any server IP:port

## 🛠️ Troubleshooting

### Connection Issues

**"Connection failed" error:**
1. Verify the server is running on the host machine
2. Check that the IP address is correct
3. Ensure port 3000 isn't blocked by firewall
4. Try disabling firewall temporarily for testing

**Windows Firewall:**
```cmd
# Allow Node.js through firewall (run as administrator)
netsh advfirewall firewall add rule name="DOOM Protocol Server" dir=in action=allow protocol=TCP localport=3000
```

**Mac/Linux Firewall:**
```bash
# Ubuntu/Debian
sudo ufw allow 3000

# macOS
sudo pfctl -f /etc/pf.conf
```

### Network Discovery

**Can't find host IP:**
1. Use `ping` to test connectivity between machines
2. Ensure all devices are on the same subnet
3. Check router settings for device isolation

**Example ping test:**
```bash
ping 192.168.1.100
```

### Performance Issues

**High latency:**
- Use wired connections when possible
- Ensure good WiFi signal strength
- Close bandwidth-heavy applications

**Sync issues:**
- Check that all players have similar hardware performance
- Ensure stable network connections

## 🎯 Game Features

### Multiplayer Capabilities
- **2-4 players** per chamber
- **Real-time synchronization** of player positions and actions
- **Shared demon spawning** and wave progression
- **In-game chat** for coordination
- **Leader-based room management**

### Room Management
- **Room creation** with customizable settings
- **Player ready system** before starting
- **Automatic leadership transfer** if host leaves
- **Room cleanup** for abandoned chambers

## 🚀 Advanced Setup

### Custom Port
Set a custom port using environment variables:
```bash
PORT=8080 npm run dev
```

### Multiple Network Interfaces
The server automatically detects and displays all available network interfaces. Choose the one that matches your network setup.

### Production Deployment
For persistent servers:
```bash
# Build the server
npm run build

# Start with PM2 (install with: npm install -g pm2)
pm2 start dist/index.js --name "doom-protocol"
```

## 📱 Mobile/Tablet Support

The game UI is responsive and works on mobile devices, though gameplay is optimized for desktop with keyboard and mouse controls.

## 🔐 Security Notes

- The server allows all origins in development mode for easy LAN access
- For production deployment, configure specific allowed origins
- Consider using HTTPS for external connections

## 🎮 Gameplay Tips

### LAN Party Best Practices
1. **Designate a host** with a stable connection
2. **Use voice chat** (Discord, etc.) for better coordination
3. **Ensure all players understand controls** before starting
4. **Plan for 15-30 minute sessions** for best experience

### Network Optimization
- **Wired connections** for the host machine
- **5GHz WiFi** for wireless players when available
- **Close unnecessary applications** to free up bandwidth

---

## 🆘 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify server logs for connection attempts
3. Test with localhost first, then expand to LAN
4. Ensure all players are using the same game version

**Happy demon hunting! 👹🔥** 