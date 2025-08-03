import { JsonDemonManager } from "./JsonDemonManager";
import { JsonDemonConfig, DemonManagerState } from "@/types/demonJson";
import * as THREE from "three";

/**
 * UI Manager for demon JSON configuration management
 */
export class DemonManagerUI {
  private jsonManager: JsonDemonManager;
  private container: HTMLElement | null = null;
  private state: DemonManagerState = {
    activeTab: "individual",
    editMode: false,
    showPreview: false,
  };

  // 3D Preview properties
  private previewScene: THREE.Scene | null = null;
  private previewCamera: THREE.PerspectiveCamera | null = null;
  private previewRenderer: THREE.WebGLRenderer | null = null;
  private previewModel: THREE.Group | null = null;
  private previewControls: any = null; // OrbitControls
  private isAutoRotating: boolean = false;
  private animationId: number | null = null;

  constructor(jsonManager: JsonDemonManager) {
    this.jsonManager = jsonManager;
  }

  /**
   * Create and show the demon manager UI
   */
  public show(): void {
    if (this.container) {
      this.container.style.display = "block";
      return;
    }

    this.createUI();
    this.bindEvents();
    this.refreshUI();
  }

  /**
   * Hide the demon manager UI
   */
  public hide(): void {
    if (this.container) {
      this.container.style.display = "none";
    }
  }

  /**
   * Toggle UI visibility
   */
  public toggle(): void {
    if (this.container && this.container.style.display === "none") {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Create the main UI structure
   */
  private createUI(): void {
    this.container = document.createElement("div");
    this.container.id = "demon-manager-ui";
    this.container.innerHTML = `
      <div class="demon-manager-overlay">
        <div class="demon-manager-panel">
          <div class="demon-manager-header">
            <h2>🎮 Demon Manager</h2>
            <button class="close-btn" id="close-demon-manager">×</button>
          </div>
          
          <div class="demon-manager-tabs">
            <button class="tab-btn active" data-tab="individual">👹 Individual</button>
            <button class="tab-btn" data-tab="collections">📚 Collections</button>
            <button class="tab-btn" data-tab="import">📥 Import</button>
            <button class="tab-btn" data-tab="export">📤 Export</button>
          </div>

          <div class="demon-manager-content">
            <div class="tab-content active" id="tab-individual">
              <div class="section-header">
                <h3>Individual Demons</h3>
                <button class="btn-primary" id="add-new-demon">+ Add New</button>
              </div>
              <div class="demon-list" id="individual-demon-list"></div>
            </div>

            <div class="tab-content" id="tab-collections">
              <div class="section-header">
                <h3>Demon Collections</h3>
                <button class="btn-primary" id="add-new-collection">+ Add Collection</button>
              </div>
              <div class="collection-list" id="collection-list"></div>
            </div>

            <div class="tab-content" id="tab-import">
              <h3>Import Demons</h3>
              <div class="import-section">
                <label for="import-text">Paste JSON configuration:</label>
                <textarea id="import-text" placeholder="Paste your demon JSON configuration here..." rows="10"></textarea>
                <div class="import-actions">
                  <button class="btn-primary" id="import-demons">Import</button>
                  <button class="btn-secondary" id="validate-import">Validate</button>
                </div>
                <div class="validation-results" id="validation-results"></div>
              </div>
            </div>

            <div class="tab-content" id="tab-export">
              <h3>Export Demons</h3>
              <div class="export-section">
                <p>Export all your custom demons and collections as JSON:</p>
                <div class="export-actions">
                  <button class="btn-primary" id="export-all">Export All</button>
                  <button class="btn-secondary" id="copy-export">Copy to Clipboard</button>
                </div>
                <textarea id="export-text" readonly rows="10"></textarea>
              </div>
            </div>
          </div>

          <div class="demon-manager-settings">
            <h4>Settings</h4>
            <label class="checkbox-label">
              <input type="checkbox" id="auto-load-setting"> Auto-load demons on game start
            </label>
            <div class="setting-row">
              <label for="max-demons-setting">Max demons to load:</label>
              <input type="number" id="max-demons-setting" min="1" max="100" value="50">
            </div>
            <button class="btn-danger" id="clear-all-data">Clear All Data</button>
          </div>
        </div>
      </div>

      <!-- Demon Editor Modal -->
      <div class="demon-editor-modal" id="demon-editor-modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="editor-title">Edit Demon</h3>
            <button class="close-btn" id="close-editor">×</button>
          </div>
          <div class="modal-body">
            <form id="demon-editor-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="demon-id">ID (unique):</label>
                  <input type="text" id="demon-id" required>
                </div>
                <div class="form-group">
                  <label for="demon-name">Name:</label>
                  <input type="text" id="demon-name" required>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="demon-emoji">Emoji:</label>
                  <input type="text" id="demon-emoji" maxlength="2" required>
                </div>
                <div class="form-group">
                  <label for="demon-description">Description:</label>
                  <input type="text" id="demon-description">
                </div>
              </div>

              <h4>Stats</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="demon-health">Health (1-20):</label>
                  <input type="number" id="demon-health" min="1" max="20" required>
                </div>
                <div class="form-group">
                  <label for="demon-speed">Speed (0.1-5.0):</label>
                  <input type="number" id="demon-speed" min="0.1" max="5.0" step="0.1" required>
                </div>
                <div class="form-group">
                  <label for="demon-scale">Scale (0.1-5.0):</label>
                  <input type="number" id="demon-scale" min="0.1" max="5.0" step="0.1" required>
                </div>
              </div>

              <h4>Colors</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="color-primary">Primary Color:</label>
                  <input type="color" id="color-primary" required>
                </div>
                <div class="form-group">
                  <label for="color-head">Head Color:</label>
                  <input type="color" id="color-head" required>
                </div>
                <div class="form-group">
                  <label for="color-eyes">Eye Color:</label>
                  <input type="color" id="color-eyes" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="color-secondary">Secondary Color:</label>
                  <input type="color" id="color-secondary">
                </div>
                <div class="form-group">
                  <label for="color-accent">Accent Color:</label>
                  <input type="color" id="color-accent">
                </div>
              </div>

              <h4>Behavior</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="detect-range">Detect Range:</label>
                  <input type="number" id="detect-range" min="10" max="200" required>
                </div>
                <div class="form-group">
                  <label for="attack-range">Attack Range:</label>
                  <input type="number" id="attack-range" min="1" max="150" required>
                </div>
                <div class="form-group">
                  <label for="chase-range">Chase Range:</label>
                  <input type="number" id="chase-range" min="1" max="100" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="attack-damage">Attack Damage:</label>
                  <input type="number" id="attack-damage" min="1" max="100" required>
                </div>
                <div class="form-group">
                  <label for="spawn-weight">Spawn Weight:</label>
                  <input type="number" id="spawn-weight" min="1" max="100" required>
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="is-ranged"> Ranged attacker
                </label>
              </div>

              <div class="ranged-options" id="ranged-options" style="display: none;">
                <div class="form-row">
                  <div class="form-group">
                    <label for="fireball-speed">Fireball Speed:</label>
                    <input type="number" id="fireball-speed" min="1" max="50" step="0.1">
                  </div>
                  <div class="form-group">
                    <label for="fireball-range">Fireball Range:</label>
                    <input type="number" id="fireball-range" min="1" max="200">
                  </div>
                  <div class="form-group">
                    <label for="attack-cooldown">Attack Cooldown:</label>
                    <input type="number" id="attack-cooldown" min="30" max="600">
                  </div>
                </div>
              </div>

              <h4>Appearance</h4>
              <div class="form-group">
                <label for="body-type">Body Type:</label>
                <select id="body-type" required>
                  <option value="humanoid">Humanoid</option>
                  <option value="quadruped">Quadruped</option>
                  <option value="dragon">Dragon</option>
                  <option value="small_biped">Small Biped</option>
                  <option value="floating">Floating</option>
                </select>
              </div>

              <div class="visual-features">
                <h5>Visual Features</h5>
                <div class="checkbox-grid">
                  <label class="checkbox-label">
                    <input type="checkbox" id="has-wings"> Wings
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" id="has-tail"> Tail
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" id="has-horns"> Horns
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" id="has-claws"> Claws
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" id="has-spikes"> Spikes
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" id="has-armor"> Armor
                  </label>
                </div>
                
                <div class="form-group">
                  <label for="special-features">Special Features (comma-separated):</label>
                  <input type="text" id="special-features" placeholder="fire_breath, lightning_bolt, etc.">
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-primary">Save Demon</button>
                <button type="button" class="btn-secondary" id="preview-demon">Preview</button>
                <button type="button" class="btn-secondary" id="cancel-edit">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Demon Preview Modal -->
      <div class="demon-preview-modal" id="demon-preview-modal" style="display: none;">
        <div class="preview-modal-content">
          <div class="preview-modal-header">
            <h3 id="preview-title">Demon Preview</h3>
            <button class="close-btn" id="close-preview">×</button>
          </div>
          <div class="preview-modal-body">
            <div class="preview-content-grid">
              <!-- 3D Model Viewer -->
              <div class="preview-3d-viewer">
                <div class="viewer-header">
                  <h5>🎮 3D Model Preview</h5>
                  <div class="viewer-controls">
                    <button class="viewer-btn" id="rotate-model" title="Auto Rotate">🔄</button>
                    <button class="viewer-btn" id="reset-camera" title="Reset View">📷</button>
                  </div>
                </div>
                <div class="model-canvas-container">
                  <canvas id="preview-canvas" width="400" height="300"></canvas>
                  <div class="canvas-overlay" id="canvas-loading">
                    <div class="loading-spinner"></div>
                    <span>Loading Model...</span>
                  </div>
                </div>
              </div>

              <!-- Information Panel -->
              <div class="preview-info">
                <div class="preview-basic-info">
                  <div class="preview-demon-header">
                    <span class="preview-emoji" id="preview-emoji">👹</span>
                    <h4 id="preview-name">Demon Name</h4>
                  </div>
                  <p id="preview-description">Description</p>
                </div>
              
              <div class="preview-stats-grid">
                <div class="preview-stat-group">
                  <h5>📊 Base Stats</h5>
                  <div class="preview-stat-item">
                    <span class="stat-label">Health:</span>
                    <span class="stat-value" id="preview-health">0</span>
                  </div>
                  <div class="preview-stat-item">
                    <span class="stat-label">Speed:</span>
                    <span class="stat-value" id="preview-speed">0</span>
                  </div>
                  <div class="preview-stat-item">
                    <span class="stat-label">Scale:</span>
                    <span class="stat-value" id="preview-scale">0</span>
                  </div>
                </div>

                <div class="preview-stat-group">
                  <h5>⚔️ Combat Stats</h5>
                  <div class="preview-stat-item">
                    <span class="stat-label">Attack Damage:</span>
                    <span class="stat-value" id="preview-damage">0</span>
                  </div>
                  <div class="preview-stat-item">
                    <span class="stat-label">Attack Range:</span>
                    <span class="stat-value" id="preview-attack-range">0</span>
                  </div>
                  <div class="preview-stat-item">
                    <span class="stat-label">Detect Range:</span>
                    <span class="stat-value" id="preview-detect-range">0</span>
                  </div>
                  <div class="preview-stat-item">
                    <span class="stat-label">Chase Range:</span>
                    <span class="stat-value" id="preview-chase-range">0</span>
                  </div>
                </div>

                <div class="preview-stat-group">
                  <h5>🎯 Spawn Info</h5>
                  <div class="preview-stat-item">
                    <span class="stat-label">Spawn Weight:</span>
                    <span class="stat-value" id="preview-spawn-weight">0</span>
                  </div>
                  <div class="preview-stat-item">
                    <span class="stat-label">Attack Type:</span>
                    <span class="stat-value" id="preview-attack-type">Melee</span>
                  </div>
                </div>
              </div>

              <div class="preview-appearance">
                <h5>👁️ Appearance</h5>
                <div class="preview-body-type">
                  <span class="stat-label">Body Type:</span>
                  <span class="stat-value" id="preview-body-type">humanoid</span>
                </div>
                <div class="preview-features" id="preview-features">
                  <!-- Visual features will be populated here -->
                </div>
                <div class="preview-colors">
                  <h6>🎨 Colors</h6>
                  <div class="color-preview-grid">
                    <div class="color-preview-item">
                      <span class="color-label">Primary</span>
                      <div class="color-swatch" id="preview-color-primary"></div>
                    </div>
                    <div class="color-preview-item">
                      <span class="color-label">Head</span>
                      <div class="color-swatch" id="preview-color-head"></div>
                    </div>
                    <div class="color-preview-item">
                      <span class="color-label">Eyes</span>
                      <div class="color-swatch" id="preview-color-eyes"></div>
                    </div>
                    <div class="color-preview-item" id="preview-color-secondary-container" style="display: none;">
                      <span class="color-label">Secondary</span>
                      <div class="color-swatch" id="preview-color-secondary"></div>
                    </div>
                    <div class="color-preview-item" id="preview-color-accent-container" style="display: none;">
                      <span class="color-label">Accent</span>
                      <div class="color-swatch" id="preview-color-accent"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="preview-themes" id="preview-themes">
                <h5>🎪 Theme Variants</h5>
                <div class="theme-preview-grid">
                  <!-- Theme previews will be populated here -->
                </div>
              </div>
              </div>
            </div>
          </div>
          <div class="preview-modal-footer">
            <button class="btn-secondary" id="close-preview-btn">Close</button>
            <button class="btn-primary" id="edit-from-preview">Edit Demon</button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    this.addStyles();

    document.body.appendChild(this.container);
  }

  /**
   * Add CSS styles for the UI
   */
  private addStyles(): void {
    if (document.getElementById("demon-manager-styles")) return;

    const styles = document.createElement("style");
    styles.id = "demon-manager-styles";
    styles.textContent = `
      .demon-manager-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }

      .demon-manager-panel {
        background: #1a1a1a;
        border: 2px solid #333;
        border-radius: 8px;
        width: 90%;
        max-width: 1000px;
        max-height: 90%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        color: #fff;
      }

      .demon-manager-header {
        background: #333;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #555;
      }

      .demon-manager-header h2 {
        margin: 0;
        font-size: 1.5rem;
      }

      .close-btn {
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .demon-manager-tabs {
        display: flex;
        background: #2a2a2a;
        border-bottom: 1px solid #555;
      }

      .tab-btn {
        background: none;
        border: none;
        color: #ccc;
        padding: 12px 20px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.3s;
      }

      .tab-btn:hover {
        color: #fff;
        background: #333;
      }

      .tab-btn.active {
        color: #fff;
        border-bottom-color: #ff6600;
        background: #333;
      }

      .demon-manager-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .tab-content {
        display: none;
      }

      .tab-content.active {
        display: block;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .section-header h3 {
        margin: 0;
      }

      .btn-primary, .btn-secondary, .btn-danger {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
      }

      .btn-primary {
        background: #ff6600;
        color: white;
      }

      .btn-primary:hover {
        background: #e55a00;
      }

      .btn-secondary {
        background: #555;
        color: white;
      }

      .btn-secondary:hover {
        background: #666;
      }

      .btn-danger {
        background: #ff4444;
        color: white;
      }

      .btn-danger:hover {
        background: #dd3333;
      }

      .demon-list, .collection-list {
        display: grid;
        gap: 15px;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      }

      .demon-card, .collection-card {
        background: #333;
        border: 1px solid #555;
        border-radius: 6px;
        padding: 15px;
        transition: transform 0.2s;
      }

      .demon-card:hover, .collection-card:hover {
        transform: translateY(-2px);
        border-color: #ff6600;
      }

      .demon-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .demon-emoji {
        font-size: 24px;
      }

      .demon-name {
        font-weight: bold;
        font-size: 16px;
      }

      .demon-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        font-size: 12px;
        margin: 10px 0;
      }

      .demon-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }

      .import-section, .export-section {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .import-section textarea, .export-section textarea {
        background: #333;
        color: white;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 10px;
        resize: vertical;
        font-family: monospace;
      }

      .import-actions, .export-actions {
        display: flex;
        gap: 10px;
      }

      .validation-results {
        background: #2a2a2a;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 10px;
        margin-top: 10px;
        min-height: 50px;
      }

      .validation-error {
        color: #ff6666;
      }

      .validation-warning {
        color: #ffaa66;
      }

      .validation-success {
        color: #66ff66;
      }

      .demon-manager-settings {
        background: #2a2a2a;
        padding: 15px 20px;
        border-top: 1px solid #555;
      }

      .demon-manager-settings h4 {
        margin: 0 0 15px 0;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        cursor: pointer;
      }

      .setting-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
      }

      .setting-row input {
        background: #333;
        color: white;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 5px 8px;
        width: 80px;
      }

      /* Modal Styles */
      .demon-editor-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
      }

      .modal-content {
        background: #1a1a1a;
        border: 2px solid #333;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 90%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        color: #fff;
      }

      .modal-header {
        background: #333;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #555;
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 15px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .form-group label {
        font-weight: bold;
        font-size: 14px;
      }

      .form-group input, .form-group select, .form-group textarea {
        background: #333;
        color: white;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 8px;
      }

      .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
        outline: none;
        border-color: #ff6600;
      }

      .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
        margin: 10px 0;
      }

      .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #555;
      }

      .ranged-options {
        background: #2a2a2a;
        padding: 15px;
        border-radius: 4px;
        margin-top: 10px;
      }

      /* Demon Preview Modal Styles */
      .demon-preview-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      }

      .preview-modal-content {
        background: #1a1a1a;
        border: 2px solid #ff6600;
        border-radius: 8px;
        width: 95%;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
        color: white;
      }

      .preview-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #333;
        background: #2a2a2a;
      }

      .preview-modal-header h3 {
        margin: 0;
        color: #ff6600;
      }

      .preview-modal-body {
        padding: 20px;
      }

      .preview-content-grid {
        display: grid;
        grid-template-columns: 400px 1fr;
        gap: 20px;
        align-items: start;
      }

      /* 3D Viewer Styles */
      .preview-3d-viewer {
        background: #2a2a2a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 15px;
        position: sticky;
        top: 0;
      }

      .viewer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #333;
      }

      .viewer-header h5 {
        margin: 0;
        color: #ff6600;
        font-size: 1.1rem;
      }

      .viewer-controls {
        display: flex;
        gap: 8px;
      }

      .viewer-btn {
        background: #333;
        border: 1px solid #555;
        color: #ccc;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.3s;
      }

      .viewer-btn:hover {
        background: #ff6600;
        border-color: #ff6600;
        color: white;
      }

      .viewer-btn.active {
        background: #ff6600;
        border-color: #ff6600;
        color: white;
      }

      .model-canvas-container {
        position: relative;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 6px;
        overflow: hidden;
      }

      #preview-canvas {
        display: block;
        width: 100% !important;
        height: 300px !important;
        cursor: grab;
        background: #0a0a0a;
        border: 1px solid #333;
      }

      #preview-canvas:active {
        cursor: grabbing;
      }

      .canvas-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: #ccc;
        transition: opacity 0.3s;
      }

      .canvas-overlay.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #333;
        border-top: 3px solid #ff6600;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Responsive adjustments */
      @media (max-width: 800px) {
        .preview-content-grid {
          grid-template-columns: 1fr;
          gap: 15px;
        }
        
        .preview-3d-viewer {
          position: static;
        }
      }

      .preview-basic-info {
        margin-bottom: 25px;
      }

      .preview-demon-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 10px;
      }

      .preview-emoji {
        font-size: 2.5rem;
      }

      .preview-demon-header h4 {
        margin: 0;
        color: #ff6600;
        font-size: 1.5rem;
      }

      .preview-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 25px;
      }

      .preview-stat-group {
        background: #2a2a2a;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #333;
      }

      .preview-stat-group h5 {
        margin: 0 0 15px 0;
        color: #ff6600;
        font-size: 1.1rem;
        border-bottom: 1px solid #333;
        padding-bottom: 8px;
      }

      .preview-stat-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 4px 0;
      }

      .stat-label {
        color: #ccc;
      }

      .stat-value {
        color: #fff;
        font-weight: bold;
      }

      .preview-appearance {
        background: #2a2a2a;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #333;
        margin-bottom: 25px;
      }

      .preview-appearance h5 {
        margin: 0 0 15px 0;
        color: #ff6600;
        font-size: 1.1rem;
        border-bottom: 1px solid #333;
        padding-bottom: 8px;
      }

      .preview-body-type {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        padding: 4px 0;
      }

      .preview-features {
        margin-bottom: 15px;
      }

      .feature-tag {
        display: inline-block;
        background: #ff6600;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        margin: 2px;
        font-size: 0.85rem;
      }

      .preview-colors h6 {
        margin: 15px 0 10px 0;
        color: #ccc;
      }

      .color-preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
      }

      .color-preview-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }

      .color-label {
        font-size: 0.85rem;
        color: #ccc;
      }

      .color-swatch {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid #333;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .preview-themes {
        background: #2a2a2a;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #333;
      }

      .preview-themes h5 {
        margin: 0 0 15px 0;
        color: #ff6600;
        font-size: 1.1rem;
        border-bottom: 1px solid #333;
        padding-bottom: 8px;
      }

      .theme-preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
      }

      .theme-preview-item {
        text-align: center;
      }

      .theme-preview-item h6 {
        margin: 0 0 8px 0;
        color: #ccc;
        font-size: 0.9rem;
      }

      .theme-color-row {
        display: flex;
        justify-content: center;
        gap: 5px;
      }

      .theme-color-swatch {
        width: 25px;
        height: 25px;
        border-radius: 4px;
        border: 1px solid #333;
      }

      .preview-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 20px;
        border-top: 1px solid #333;
        background: #2a2a2a;
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    if (!this.container) return;

    // Close button
    this.container
      .querySelector("#close-demon-manager")
      ?.addEventListener("click", () => {
        this.hide();
      });

    // Tab switching
    this.container.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.dataset.tab;
        if (tabName) {
          this.switchTab(tabName as any);
        }
      });
    });

    // Add new demon button
    this.container
      .querySelector("#add-new-demon")
      ?.addEventListener("click", () => {
        this.openDemonEditor();
      });

    // Import/Export functionality
    this.bindImportExportEvents();

    // Settings
    this.bindSettingsEvents();

    // Modal events
    this.bindModalEvents();
  }

  /**
   * Bind import/export events
   */
  private bindImportExportEvents(): void {
    if (!this.container) return;

    // Import functionality
    this.container
      .querySelector("#validate-import")
      ?.addEventListener("click", () => {
        const textarea = this.container?.querySelector(
          "#import-text"
        ) as HTMLTextAreaElement;
        const resultsDiv = this.container?.querySelector("#validation-results");

        if (textarea && resultsDiv) {
          const jsonText = textarea.value.trim();
          if (!jsonText) {
            resultsDiv.innerHTML =
              '<div class="validation-error">Please paste JSON configuration</div>';
            return;
          }

          try {
            const validation = this.jsonManager.importData(jsonText);
            let html = "";

            if (validation.isValid) {
              html +=
                '<div class="validation-success">✅ Configuration is valid!</div>';
            } else {
              html +=
                '<div class="validation-error">❌ Configuration has errors:</div>';
              validation.errors.forEach((error) => {
                html += `<div class="validation-error">• ${error}</div>`;
              });
            }

            if (validation.warnings.length > 0) {
              html += '<div class="validation-warning">⚠️ Warnings:</div>';
              validation.warnings.forEach((warning) => {
                html += `<div class="validation-warning">• ${warning}</div>`;
              });
            }

            resultsDiv.innerHTML = html;
          } catch (error) {
            resultsDiv.innerHTML = `<div class="validation-error">❌ Invalid JSON format: ${error}</div>`;
          }
        }
      });

    this.container
      .querySelector("#import-demons")
      ?.addEventListener("click", () => {
        const textarea = this.container?.querySelector(
          "#import-text"
        ) as HTMLTextAreaElement;
        const resultsDiv = this.container?.querySelector("#validation-results");

        if (textarea && resultsDiv) {
          const jsonText = textarea.value.trim();
          if (!jsonText) {
            resultsDiv.innerHTML =
              '<div class="validation-error">Please paste JSON configuration</div>';
            return;
          }

          const validation = this.jsonManager.importData(jsonText);

          if (validation.isValid) {
            resultsDiv.innerHTML =
              '<div class="validation-success">✅ Successfully imported demons!</div>';
            textarea.value = "";
            this.refreshUI();
          } else {
            let html = '<div class="validation-error">❌ Import failed:</div>';
            validation.errors.forEach((error) => {
              html += `<div class="validation-error">• ${error}</div>`;
            });
            resultsDiv.innerHTML = html;
          }
        }
      });

    // Export functionality
    this.container
      .querySelector("#export-all")
      ?.addEventListener("click", () => {
        const textarea = this.container?.querySelector(
          "#export-text"
        ) as HTMLTextAreaElement;
        if (textarea) {
          textarea.value = this.jsonManager.exportData();
        }
      });

    this.container
      .querySelector("#copy-export")
      ?.addEventListener("click", () => {
        const textarea = this.container?.querySelector(
          "#export-text"
        ) as HTMLTextAreaElement;
        if (textarea && textarea.value) {
          navigator.clipboard.writeText(textarea.value).then(() => {
            // Show temporary success message
            const btn = this.container?.querySelector("#copy-export");
            if (btn) {
              const originalText = btn.textContent;
              btn.textContent = "Copied!";
              setTimeout(() => {
                btn.textContent = originalText;
              }, 2000);
            }
          });
        }
      });
  }

  /**
   * Bind settings events
   */
  private bindSettingsEvents(): void {
    if (!this.container) return;

    const autoLoadCheckbox = this.container.querySelector(
      "#auto-load-setting"
    ) as HTMLInputElement;
    const maxDemonsInput = this.container.querySelector(
      "#max-demons-setting"
    ) as HTMLInputElement;

    if (autoLoadCheckbox) {
      // Set initial value and bind change event
      autoLoadCheckbox.addEventListener("change", () => {
        this.jsonManager.updateSettings({ autoLoad: autoLoadCheckbox.checked });
      });
    }

    if (maxDemonsInput) {
      maxDemonsInput.addEventListener("change", () => {
        const value = parseInt(maxDemonsInput.value);
        if (value >= 1 && value <= 100) {
          this.jsonManager.updateSettings({ maxDemons: value });
        }
      });
    }

    this.container
      .querySelector("#clear-all-data")
      ?.addEventListener("click", () => {
        if (
          confirm(
            "Are you sure you want to clear all custom demon data? This cannot be undone."
          )
        ) {
          this.jsonManager.clearAllData();
          this.refreshUI();
        }
      });
  }

  /**
   * Bind modal events
   */
  private bindModalEvents(): void {
    const modal = document.querySelector("#demon-editor-modal");
    if (!modal) return;

    // Bind preview modal events
    this.bindPreviewModalEvents();

    // Close modal events
    modal.querySelector("#close-editor")?.addEventListener("click", () => {
      this.closeDemonEditor();
    });

    modal.querySelector("#cancel-edit")?.addEventListener("click", () => {
      this.closeDemonEditor();
    });

    // Ranged checkbox toggle
    const rangedCheckbox = modal.querySelector(
      "#is-ranged"
    ) as HTMLInputElement;
    const rangedOptions = modal.querySelector("#ranged-options") as HTMLElement;

    if (rangedCheckbox && rangedOptions) {
      rangedCheckbox.addEventListener("change", () => {
        rangedOptions.style.display = rangedCheckbox.checked ? "block" : "none";
      });
    }

    // Form submission
    modal
      .querySelector("#demon-editor-form")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveDemon();
      });
  }

  /**
   * Switch between tabs
   */
  private switchTab(tabName: DemonManagerState["activeTab"]): void {
    this.state.activeTab = tabName;

    // Update tab buttons
    this.container?.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-tab") === tabName) {
        btn.classList.add("active");
      }
    });

    // Update tab content
    this.container?.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active");
      if (content.id === `tab-${tabName}`) {
        content.classList.add("active");
      }
    });

    this.refreshTabContent();
  }

  /**
   * Refresh the UI content
   */
  private refreshUI(): void {
    this.refreshTabContent();
    this.updateSettingsUI();
  }

  /**
   * Refresh content for the active tab
   */
  private refreshTabContent(): void {
    switch (this.state.activeTab) {
      case "individual":
        this.refreshIndividualDemons();
        break;
      case "collections":
        this.refreshCollections();
        break;
    }
  }

  /**
   * Refresh individual demons list
   */
  private refreshIndividualDemons(): void {
    const listContainer = this.container?.querySelector(
      "#individual-demon-list"
    );
    if (!listContainer) return;

    const demons = this.jsonManager.getAllJsonDemons();

    if (demons.length === 0) {
      listContainer.innerHTML =
        '<div class="empty-state">No custom demons yet. Click "Add New" to create your first demon!</div>';
      return;
    }

    listContainer.innerHTML = demons
      .map(
        (demon) => `
      <div class="demon-card">
        <div class="demon-card-header">
          <span class="demon-emoji">${demon.emoji}</span>
          <span class="demon-name">${demon.name}</span>
        </div>
        <div class="demon-stats">
          <span>Health: ${demon.health}</span>
          <span>Speed: ${demon.speed}</span>
          <span>Damage: ${demon.behavior.attackDamage}</span>
          <span>Type: ${demon.appearance.bodyType}</span>
        </div>
        <div class="demon-actions">
          <button class="btn-primary" onclick="demonManagerUI.previewDemon('${demon.id}')">👁️ Preview</button>
          <button class="btn-secondary" onclick="demonManagerUI.editDemon('${demon.id}')">Edit</button>
          <button class="btn-danger" onclick="demonManagerUI.deleteDemon('${demon.id}')">Delete</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Refresh collections list
   */
  private refreshCollections(): void {
    const listContainer = this.container?.querySelector("#collection-list");
    if (!listContainer) return;

    const collections = this.jsonManager.getCollections();

    if (collections.length === 0) {
      listContainer.innerHTML =
        '<div class="empty-state">No demon collections yet. Click "Add Collection" to create your first collection!</div>';
      return;
    }

    listContainer.innerHTML = collections
      .map(
        (collection) => `
      <div class="collection-card">
        <h4>${collection.name}</h4>
        <p>${collection.description || "No description"}</p>
        <div class="collection-stats">
          <span>Demons: ${collection.demons.length}</span>
          <span>Author: ${collection.metadata?.author || "Unknown"}</span>
        </div>
        <div class="demon-actions">
          <button class="btn-secondary" onclick="demonManagerUI.viewCollection('${
            collection.name
          }')">View</button>
          <button class="btn-danger" onclick="demonManagerUI.deleteCollection('${
            collection.name
          }')">Delete</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Update settings UI with current values
   */
  private updateSettingsUI(): void {
    // This would be called when refreshing UI to sync settings
    // Implementation depends on how settings are stored
  }

  /**
   * Open demon editor modal
   */
  private openDemonEditor(demonId?: string): void {
    const modal = document.querySelector("#demon-editor-modal") as HTMLElement;
    if (!modal) return;

    modal.style.display = "flex";

    if (demonId) {
      // Load existing demon data
      // Implementation depends on how to get demon by ID
    } else {
      // Reset form for new demon
      this.resetDemonForm();
    }
  }

  /**
   * Close demon editor modal
   */
  private closeDemonEditor(): void {
    const modal = document.querySelector("#demon-editor-modal") as HTMLElement;
    if (modal) {
      modal.style.display = "none";
    }
  }

  /**
   * Reset demon editor form
   */
  private resetDemonForm(): void {
    const form = document.querySelector(
      "#demon-editor-form"
    ) as HTMLFormElement;
    if (form) {
      form.reset();

      // Set default values
      (form.querySelector("#demon-health") as HTMLInputElement).value = "3";
      (form.querySelector("#demon-speed") as HTMLInputElement).value = "1.0";
      (form.querySelector("#demon-scale") as HTMLInputElement).value = "1.0";
      (form.querySelector("#detect-range") as HTMLInputElement).value = "75";
      (form.querySelector("#attack-range") as HTMLInputElement).value = "5";
      (form.querySelector("#chase-range") as HTMLInputElement).value = "12";
      (form.querySelector("#attack-damage") as HTMLInputElement).value = "20";
      (form.querySelector("#spawn-weight") as HTMLInputElement).value = "50";

      // Hide ranged options
      const rangedOptions = form.querySelector(
        "#ranged-options"
      ) as HTMLElement;
      if (rangedOptions) {
        rangedOptions.style.display = "none";
      }
    }
  }

  /**
   * Save demon from form
   */
  private saveDemon(): void {
    const form = document.querySelector(
      "#demon-editor-form"
    ) as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);

    // Create JsonDemonConfig from form data
    const demon: JsonDemonConfig = {
      id: (form.querySelector("#demon-id") as HTMLInputElement).value,
      name: (form.querySelector("#demon-name") as HTMLInputElement).value,
      emoji: (form.querySelector("#demon-emoji") as HTMLInputElement).value,
      description: (
        form.querySelector("#demon-description") as HTMLInputElement
      ).value,
      health: parseInt(
        (form.querySelector("#demon-health") as HTMLInputElement).value
      ),
      speed: parseFloat(
        (form.querySelector("#demon-speed") as HTMLInputElement).value
      ),
      scale: parseFloat(
        (form.querySelector("#demon-scale") as HTMLInputElement).value
      ),
      colors: {
        primary: (form.querySelector("#color-primary") as HTMLInputElement)
          .value,
        head: (form.querySelector("#color-head") as HTMLInputElement).value,
        eyes: (form.querySelector("#color-eyes") as HTMLInputElement).value,
        secondary:
          (form.querySelector("#color-secondary") as HTMLInputElement).value ||
          undefined,
        accent:
          (form.querySelector("#color-accent") as HTMLInputElement).value ||
          undefined,
      },
      behavior: {
        detectRange: parseInt(
          (form.querySelector("#detect-range") as HTMLInputElement).value
        ),
        attackRange: parseInt(
          (form.querySelector("#attack-range") as HTMLInputElement).value
        ),
        chaseRange: parseInt(
          (form.querySelector("#chase-range") as HTMLInputElement).value
        ),
        attackDamage: parseInt(
          (form.querySelector("#attack-damage") as HTMLInputElement).value
        ),
        spawnWeight: parseInt(
          (form.querySelector("#spawn-weight") as HTMLInputElement).value
        ),
        isRanged: (form.querySelector("#is-ranged") as HTMLInputElement)
          .checked,
        fireballSpeed: (
          form.querySelector("#fireball-speed") as HTMLInputElement
        ).value
          ? parseFloat(
              (form.querySelector("#fireball-speed") as HTMLInputElement).value
            )
          : undefined,
        fireballRange: (
          form.querySelector("#fireball-range") as HTMLInputElement
        ).value
          ? parseInt(
              (form.querySelector("#fireball-range") as HTMLInputElement).value
            )
          : undefined,
        attackCooldown: (
          form.querySelector("#attack-cooldown") as HTMLInputElement
        ).value
          ? parseInt(
              (form.querySelector("#attack-cooldown") as HTMLInputElement).value
            )
          : undefined,
      },
      appearance: {
        bodyType: (form.querySelector("#body-type") as HTMLSelectElement)
          .value as any,
        visualFeatures: {
          hasWings: (form.querySelector("#has-wings") as HTMLInputElement)
            .checked,
          hasTail: (form.querySelector("#has-tail") as HTMLInputElement)
            .checked,
          hasHorns: (form.querySelector("#has-horns") as HTMLInputElement)
            .checked,
          hasClaws: (form.querySelector("#has-claws") as HTMLInputElement)
            .checked,
          hasSpikes: (form.querySelector("#has-spikes") as HTMLInputElement)
            .checked,
          hasArmor: (form.querySelector("#has-armor") as HTMLInputElement)
            .checked,
          specialFeatures: (
            form.querySelector("#special-features") as HTMLInputElement
          ).value
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        },
      },
    };

    const validation = this.jsonManager.addIndividualDemon(demon);

    if (validation.isValid) {
      this.closeDemonEditor();
      this.refreshUI();
      alert("Demon saved successfully!");
    } else {
      alert("Failed to save demon:\n" + validation.errors.join("\n"));
    }
  }

  // Public methods for global access
  public editDemon(demonId: string): void {
    this.openDemonEditor(demonId);
  }

  public deleteDemon(demonId: string): void {
    if (confirm("Are you sure you want to delete this demon?")) {
      this.jsonManager.removeIndividualDemon(demonId);
      this.refreshUI();
    }
  }

  public previewDemon(demonId: string): void {
    console.log("🔍 Preview requested for demon ID:", demonId);

    // Get the demon configuration
    const demons = this.jsonManager.getAllJsonDemons();
    console.log("📋 Available demons:", demons.length);

    const demon = demons.find((d) => d.id === demonId);

    if (!demon) {
      console.error("❌ Demon not found:", demonId);
      alert("Demon not found!");
      return;
    }

    console.log("✅ Found demon:", demon.name);
    // Show preview modal
    this.showDemonPreview(demon);
  }

  /**
   * Bind preview modal events
   */
  private bindPreviewModalEvents(): void {
    const previewModal = document.querySelector("#demon-preview-modal");
    if (!previewModal) return;

    // Close preview modal events
    previewModal
      .querySelector("#close-preview")
      ?.addEventListener("click", () => {
        this.closeDemonPreview();
      });

    previewModal
      .querySelector("#close-preview-btn")
      ?.addEventListener("click", () => {
        this.closeDemonPreview();
      });

    // Edit from preview
    previewModal
      .querySelector("#edit-from-preview")
      ?.addEventListener("click", () => {
        const demonId = previewModal.getAttribute("data-demon-id");
        if (demonId) {
          this.closeDemonPreview();
          this.editDemon(demonId);
        }
      });

    // Close on overlay click
    previewModal.addEventListener("click", (e) => {
      if (e.target === previewModal) {
        this.closeDemonPreview();
      }
    });
  }

  /**
   * Bind 3D viewer control events
   */
  private bind3DViewerEvents(): void {
    console.log("🔗 Binding 3D viewer events");

    // Auto rotate button
    const rotateBtn = document.querySelector("#rotate-model");
    console.log("🔄 Rotate button found:", !!rotateBtn);
    rotateBtn?.addEventListener("click", () => {
      console.log("🔄 Rotate button clicked");
      this.toggleAutoRotate();
    });

    // Reset camera button
    const resetBtn = document.querySelector("#reset-camera");
    console.log("📷 Reset button found:", !!resetBtn);
    resetBtn?.addEventListener("click", () => {
      console.log("📷 Reset button clicked");
      this.resetCamera();
    });
  }

  /**
   * Show demon preview modal
   */
  private showDemonPreview(demon: any): void {
    console.log("👁️ Showing demon preview for:", demon.name);

    const previewModal = document.querySelector(
      "#demon-preview-modal"
    ) as HTMLElement;

    console.log("🔍 Preview modal found:", !!previewModal);
    if (!previewModal) {
      console.error("❌ Preview modal not found in DOM");
      return;
    }

    // Store demon ID for edit functionality
    previewModal.setAttribute("data-demon-id", demon.id);

    // Populate basic info
    const previewTitle = document.querySelector("#preview-title");
    const previewEmoji = document.querySelector("#preview-emoji");
    const previewName = document.querySelector("#preview-name");
    const previewDescription = document.querySelector("#preview-description");

    if (previewTitle) previewTitle.textContent = `Preview: ${demon.name}`;
    if (previewEmoji) previewEmoji.textContent = demon.emoji;
    if (previewName) previewName.textContent = demon.name;
    if (previewDescription)
      previewDescription.textContent =
        demon.description || "No description provided.";

    // Populate stats
    this.populatePreviewStats(demon);

    // Populate appearance
    this.populatePreviewAppearance(demon);

    // Populate colors
    this.populatePreviewColors(demon);

    // Populate themes
    this.populatePreviewThemes(demon);

    // Show modal first to ensure DOM elements are rendered
    console.log("📤 Displaying modal");
    previewModal.style.display = "flex";

    // Initialize 3D model viewer after modal is shown
    setTimeout(() => {
      this.init3DViewer(demon);
    }, 100);
  }

  /**
   * Close demon preview modal
   */
  private closeDemonPreview(): void {
    const previewModal = document.querySelector(
      "#demon-preview-modal"
    ) as HTMLElement;
    if (previewModal) {
      previewModal.style.display = "none";
      previewModal.removeAttribute("data-demon-id");
    }

    // Clean up 3D scene
    this.cleanup3DViewer();
  }

  /**
   * Populate preview stats
   */
  private populatePreviewStats(demon: any): void {
    // Base stats
    const healthEl = document.querySelector("#preview-health");
    const speedEl = document.querySelector("#preview-speed");
    const scaleEl = document.querySelector("#preview-scale");

    if (healthEl) healthEl.textContent = demon.health?.toString() || "0";
    if (speedEl) speedEl.textContent = demon.speed?.toString() || "0";
    if (scaleEl) scaleEl.textContent = demon.scale?.toString() || "1.0";

    // Combat stats
    const damageEl = document.querySelector("#preview-damage");
    const attackRangeEl = document.querySelector("#preview-attack-range");
    const detectRangeEl = document.querySelector("#preview-detect-range");
    const chaseRangeEl = document.querySelector("#preview-chase-range");

    if (damageEl)
      damageEl.textContent = demon.behavior?.attackDamage?.toString() || "0";
    if (attackRangeEl)
      attackRangeEl.textContent =
        demon.behavior?.attackRange?.toString() || "0";
    if (detectRangeEl)
      detectRangeEl.textContent =
        demon.behavior?.detectRange?.toString() || "0";
    if (chaseRangeEl)
      chaseRangeEl.textContent = demon.behavior?.chaseRange?.toString() || "0";

    // Spawn info
    const spawnWeightEl = document.querySelector("#preview-spawn-weight");
    const attackTypeEl = document.querySelector("#preview-attack-type");

    if (spawnWeightEl)
      spawnWeightEl.textContent =
        demon.behavior?.spawnWeight?.toString() || "0";
    if (attackTypeEl)
      attackTypeEl.textContent = demon.behavior?.isRanged ? "Ranged" : "Melee";
  }

  /**
   * Populate preview appearance
   */
  private populatePreviewAppearance(demon: any): void {
    const bodyTypeEl = document.querySelector("#preview-body-type");
    const featuresEl = document.querySelector("#preview-features");

    if (bodyTypeEl)
      bodyTypeEl.textContent = demon.appearance?.bodyType || "humanoid";

    if (featuresEl) {
      const features = demon.appearance?.visualFeatures;
      let featuresHtml = "";

      if (features) {
        if (features.hasWings)
          featuresHtml += '<span class="feature-tag">Wings</span>';
        if (features.hasTail)
          featuresHtml += '<span class="feature-tag">Tail</span>';
        if (features.hasHorns)
          featuresHtml += '<span class="feature-tag">Horns</span>';
        if (features.hasClaws)
          featuresHtml += '<span class="feature-tag">Claws</span>';
        if (features.hasSpikes)
          featuresHtml += '<span class="feature-tag">Spikes</span>';
        if (features.hasArmor)
          featuresHtml += '<span class="feature-tag">Armor</span>';

        if (features.specialFeatures && features.specialFeatures.length > 0) {
          features.specialFeatures.forEach((feature: string) => {
            featuresHtml += `<span class="feature-tag">${feature}</span>`;
          });
        }
      }

      featuresEl.innerHTML =
        featuresHtml || '<span class="stat-value">No special features</span>';
    }
  }

  /**
   * Populate preview colors
   */
  private populatePreviewColors(demon: any): void {
    const colors = demon.colors;
    if (!colors) return;

    // Primary colors
    const primaryEl = document.querySelector("#preview-color-primary");
    const headEl = document.querySelector("#preview-color-head");
    const eyesEl = document.querySelector("#preview-color-eyes");

    if (primaryEl)
      (primaryEl as HTMLElement).style.backgroundColor =
        colors.primary || "#ff0000";
    if (headEl)
      (headEl as HTMLElement).style.backgroundColor = colors.head || "#ff0000";
    if (eyesEl)
      (eyesEl as HTMLElement).style.backgroundColor = colors.eyes || "#ffff00";

    // Optional colors
    const secondaryContainer = document.querySelector(
      "#preview-color-secondary-container"
    );
    const accentContainer = document.querySelector(
      "#preview-color-accent-container"
    );
    const secondaryEl = document.querySelector("#preview-color-secondary");
    const accentEl = document.querySelector("#preview-color-accent");

    if (colors.secondary && secondaryContainer && secondaryEl) {
      (secondaryContainer as HTMLElement).style.display = "flex";
      (secondaryEl as HTMLElement).style.backgroundColor = colors.secondary;
    } else if (secondaryContainer) {
      (secondaryContainer as HTMLElement).style.display = "none";
    }

    if (colors.accent && accentContainer && accentEl) {
      (accentContainer as HTMLElement).style.display = "flex";
      (accentEl as HTMLElement).style.backgroundColor = colors.accent;
    } else if (accentContainer) {
      (accentContainer as HTMLElement).style.display = "none";
    }
  }

  /**
   * Populate preview themes
   */
  private populatePreviewThemes(demon: any): void {
    const themesContainer = document.querySelector(".theme-preview-grid");
    if (!themesContainer) return;

    const themes = demon.themes;
    if (!themes) {
      themesContainer.innerHTML =
        '<div class="stat-value">No theme variants available</div>';
      return;
    }

    let themesHtml = "";
    const themeNames = ["hell", "ice", "toxic", "industrial"];

    themeNames.forEach((themeName) => {
      if (themes[themeName]) {
        const themeColors = themes[themeName];
        themesHtml += `
          <div class="theme-preview-item">
            <h6>${themeName.toUpperCase()}</h6>
            <div class="theme-color-row">
              ${
                themeColors.primary
                  ? `<div class="theme-color-swatch" style="background-color: ${themeColors.primary}"></div>`
                  : ""
              }
              ${
                themeColors.head
                  ? `<div class="theme-color-swatch" style="background-color: ${themeColors.head}"></div>`
                  : ""
              }
              ${
                themeColors.secondary
                  ? `<div class="theme-color-swatch" style="background-color: ${themeColors.secondary}"></div>`
                  : ""
              }
            </div>
          </div>
        `;
      }
    });

    themesContainer.innerHTML =
      themesHtml || '<div class="stat-value">No theme variants available</div>';
  }

  public viewCollection(collectionName: string): void {
    // Implementation for viewing collection details
    alert(`Viewing collection: ${collectionName}`);
  }

  public deleteCollection(collectionName: string): void {
    if (confirm("Are you sure you want to delete this collection?")) {
      // Implementation for deleting collection
      this.refreshUI();
    }
  }

  /**
   * Initialize 3D model viewer
   */
  private async init3DViewer(demon: any): Promise<void> {
    console.log("🎮 Initializing 3D viewer for demon:", demon.name);

    const canvas = document.querySelector(
      "#preview-canvas"
    ) as HTMLCanvasElement;
    const loadingOverlay = document.querySelector(
      "#canvas-loading"
    ) as HTMLElement;

    console.log("🖼️ Canvas found:", !!canvas);
    console.log("⏳ Loading overlay found:", !!loadingOverlay);

    if (!canvas || !loadingOverlay) {
      console.error("❌ Missing canvas or loading overlay elements");
      return;
    }

    try {
      // Show loading
      loadingOverlay.classList.remove("hidden");

      // Initialize Three.js scene
      this.previewScene = new THREE.Scene();
      this.previewScene.background = new THREE.Color(0x1a1a1a);

      // Setup camera
      const canvasContainer = canvas.parentElement;
      const containerWidth = canvasContainer?.clientWidth || 400;
      const containerHeight = canvasContainer?.clientHeight || 300;

      this.previewCamera = new THREE.PerspectiveCamera(
        75,
        containerWidth / containerHeight,
        0.1,
        1000
      );
      this.previewCamera.position.set(0, 1, 3);

      // Setup renderer
      this.previewRenderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
      });

      console.log("📏 Canvas dimensions:", {
        containerWidth,
        containerHeight,
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight,
      });

      this.previewRenderer.setSize(containerWidth, containerHeight);
      this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.previewRenderer.shadowMap.enabled = true;
      this.previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Add lighting
      this.setupLighting();

      // Create demon model using a simplified version of DemonSystem's createDemonModel
      this.previewModel = this.createPreviewDemonModel(demon);
      this.previewScene.add(this.previewModel);

      // Setup camera controls (simplified orbit controls)
      this.setupCameraControls(canvas);

      // Bind 3D viewer control events
      this.bind3DViewerEvents();

      // Start animation loop
      this.startAnimation();

      // Hide loading overlay
      setTimeout(() => {
        loadingOverlay.classList.add("hidden");
      }, 500);
    } catch (error) {
      console.error("Failed to initialize 3D viewer:", error);
      loadingOverlay.innerHTML =
        '<div style="color: #ff4444;">❌ Failed to load 3D model</div>';
    }
  }

  /**
   * Setup lighting for the preview scene
   */
  private setupLighting(): void {
    if (!this.previewScene) return;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.previewScene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 4, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.previewScene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xff6600, 0.3);
    fillLight.position.set(-2, 2, -1);
    this.previewScene.add(fillLight);
  }

  /**
   * Create a simplified demon model for preview
   */
  private createPreviewDemonModel(demon: any): THREE.Group {
    const demonGroup = new THREE.Group();
    const colors = demon.colors;

    // Create materials
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary || "#ff0000"),
      shininess: 10,
      specular: 0x222222,
    });

    const headMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.head || "#ff0000"),
      shininess: 15,
      specular: 0x333333,
    });

    // Create body based on body type
    const bodyType = demon.appearance?.bodyType || "humanoid";
    let bodyGeometry: THREE.BufferGeometry;

    switch (bodyType) {
      case "floating":
        bodyGeometry = new THREE.SphereGeometry(0.8, 16, 12);
        break;
      case "dragon":
        bodyGeometry = new THREE.CylinderGeometry(0.3, 0.6, 1.8, 8);
        break;
      case "quadruped":
        bodyGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.8);
        break;
      case "small_biped":
        bodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.0, 8);
        break;

      // NEW BODY TYPES for preview
      case "serpentine":
        bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 2.0, 8);
        break;
      case "arachnid":
        bodyGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        break;
      case "tentacled":
        bodyGeometry = new THREE.SphereGeometry(0.7, 12, 8);
        break;
      case "insectoid":
        bodyGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.8, 6);
        break;
      case "amorphous":
        bodyGeometry = new THREE.SphereGeometry(0.9, 8, 6); // Blob-like
        break;
      case "centauroid":
        bodyGeometry = new THREE.BoxGeometry(1.0, 0.5, 0.7);
        break;
      case "multi_headed":
        bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.0, 8);
        break;
      case "elemental":
        bodyGeometry = new THREE.SphereGeometry(0.6, 12, 8);
        break;
      case "mechanical":
        bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
        break;
      case "plant_like":
        bodyGeometry = new THREE.CylinderGeometry(0.2, 0.4, 1.5, 8);
        break;
      case "crystalline":
        bodyGeometry = new THREE.ConeGeometry(0.5, 1.2, 8);
        break;
      case "swarm":
        bodyGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        break;
      case "giant_humanoid":
        bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.8, 8);
        break;
      case "winged_humanoid":
        bodyGeometry = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8);
        break;
      case "aquatic":
        bodyGeometry = new THREE.SphereGeometry(0.6, 12, 8);
        break;

      case "humanoid":
      default:
        bodyGeometry = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8);
        break;
    }

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = bodyType === "floating" ? 1.0 : 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    demonGroup.add(body);

    // Create head
    let headGeometry: THREE.BufferGeometry;
    if (bodyType === "floating") {
      headGeometry = new THREE.SphereGeometry(0.3, 12, 8);
    } else if (bodyType === "dragon") {
      headGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
    } else {
      headGeometry = new THREE.SphereGeometry(0.25, 12, 8);
    }

    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = bodyType === "floating" ? 1.5 : 1.4;
    head.castShadow = true;
    head.receiveShadow = true;
    demonGroup.add(head);

    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(colors.eyes || "#ffff00"),
      emissive: new THREE.Color(colors.eyes || "#ffff00"),
      emissiveIntensity: 0.6,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());

    leftEye.position.set(-0.1, head.position.y + 0.05, 0.2);
    rightEye.position.set(0.1, head.position.y + 0.05, 0.2);

    demonGroup.add(leftEye);
    demonGroup.add(rightEye);

    // Add visual features based on demon config
    this.addPreviewFeatures(demonGroup, demon, bodyMaterial);

    // Scale the model
    const scale = demon.scale || 1.0;
    demonGroup.scale.setScalar(scale);

    return demonGroup;
  }

  /**
   * Add visual features to the preview model
   */
  private addPreviewFeatures(
    demonGroup: THREE.Group,
    demon: any,
    baseMaterial: THREE.Material
  ): void {
    const features = demon.appearance?.visualFeatures;
    if (!features) return;

    const featureMaterial = baseMaterial.clone();

    // Add wings
    if (features.hasWings) {
      const wingGeometry = new THREE.PlaneGeometry(0.6, 0.4);
      const leftWing = new THREE.Mesh(wingGeometry, featureMaterial);
      const rightWing = new THREE.Mesh(wingGeometry, featureMaterial);

      leftWing.position.set(-0.5, 1.0, -0.2);
      rightWing.position.set(0.5, 1.0, -0.2);
      leftWing.rotation.y = Math.PI / 4;
      rightWing.rotation.y = -Math.PI / 4;

      demonGroup.add(leftWing);
      demonGroup.add(rightWing);
    }

    // Add horns
    if (features.hasHorns) {
      const hornGeometry = new THREE.ConeGeometry(0.05, 0.3, 6);
      const leftHorn = new THREE.Mesh(hornGeometry, featureMaterial);
      const rightHorn = new THREE.Mesh(hornGeometry, featureMaterial);

      leftHorn.position.set(-0.15, 1.6, 0);
      rightHorn.position.set(0.15, 1.6, 0);

      demonGroup.add(leftHorn);
      demonGroup.add(rightHorn);
    }

    // Add tail
    if (features.hasTail) {
      const tailGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.8, 6);
      const tail = new THREE.Mesh(tailGeometry, featureMaterial);
      tail.position.set(0, 0.3, -0.6);
      tail.rotation.x = Math.PI / 3;
      demonGroup.add(tail);
    }

    // Add basic limbs for humanoid types
    const bodyType = demon.appearance?.bodyType || "humanoid";
    if (bodyType === "humanoid" || bodyType === "small_biped") {
      this.addBasicLimbs(demonGroup, featureMaterial, features.hasClaws);
    }
  }

  /**
   * Add basic limbs to humanoid demons
   */
  private addBasicLimbs(
    demonGroup: THREE.Group,
    material: THREE.Material,
    hasClaws: boolean
  ): void {
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6);
    const leftArm = new THREE.Mesh(armGeometry, material);
    const rightArm = new THREE.Mesh(armGeometry, material);

    leftArm.position.set(-0.35, 0.8, 0);
    rightArm.position.set(0.35, 0.8, 0);
    leftArm.rotation.z = 0.3;
    rightArm.rotation.z = -0.3;

    demonGroup.add(leftArm);
    demonGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6);
    const leftLeg = new THREE.Mesh(legGeometry, material);
    const rightLeg = new THREE.Mesh(legGeometry, material);

    leftLeg.position.set(-0.15, -0.2, 0);
    rightLeg.position.set(0.15, -0.2, 0);

    demonGroup.add(leftLeg);
    demonGroup.add(rightLeg);

    // Add claws if specified
    if (hasClaws) {
      const clawGeometry = new THREE.ConeGeometry(0.02, 0.1, 6);
      const clawMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

      for (let i = 0; i < 3; i++) {
        const leftClaw = new THREE.Mesh(clawGeometry, clawMaterial);
        const rightClaw = new THREE.Mesh(clawGeometry, clawMaterial);

        leftClaw.position.set(-0.35 + i * 0.03, 0.5, 0.1);
        rightClaw.position.set(0.35 - i * 0.03, 0.5, 0.1);
        leftClaw.rotation.x = Math.PI;
        rightClaw.rotation.x = Math.PI;

        demonGroup.add(leftClaw);
        demonGroup.add(rightClaw);
      }
    }
  }

  /**
   * Setup simple camera controls
   */
  private setupCameraControls(canvas: HTMLCanvasElement): void {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    canvas.addEventListener("mousedown", (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    canvas.addEventListener("mousemove", (event) => {
      if (!isMouseDown || !this.previewModel) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;

      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    canvas.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    canvas.addEventListener("mouseleave", () => {
      isMouseDown = false;
    });

    // Smooth rotation update
    const updateRotation = () => {
      if (this.previewModel && !this.isAutoRotating) {
        currentRotationX += (targetRotationX - currentRotationX) * 0.1;
        currentRotationY += (targetRotationY - currentRotationY) * 0.1;

        this.previewModel.rotation.x = currentRotationX;
        this.previewModel.rotation.y = currentRotationY;
      }
    };

    // Store the update function for the animation loop
    this.previewControls = { updateRotation };
  }

  /**
   * Start the animation loop
   */
  private startAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const animate = () => {
      if (!this.previewRenderer || !this.previewScene || !this.previewCamera)
        return;

      // Auto rotation
      if (this.isAutoRotating && this.previewModel) {
        this.previewModel.rotation.y += 0.01;
      }

      // Manual controls
      if (this.previewControls && this.previewControls.updateRotation) {
        this.previewControls.updateRotation();
      }

      this.previewRenderer.render(this.previewScene, this.previewCamera);
      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Toggle auto rotation
   */
  private toggleAutoRotate(): void {
    this.isAutoRotating = !this.isAutoRotating;
    const rotateBtn = document.querySelector("#rotate-model");
    if (rotateBtn) {
      rotateBtn.classList.toggle("active", this.isAutoRotating);
    }
  }

  /**
   * Reset camera position
   */
  private resetCamera(): void {
    if (this.previewCamera) {
      this.previewCamera.position.set(0, 1, 3);
      this.previewCamera.lookAt(0, 1, 0);
    }
    if (this.previewModel) {
      this.previewModel.rotation.set(0, 0, 0);
    }
  }

  /**
   * Cleanup 3D viewer resources
   */
  private cleanup3DViewer(): void {
    // Stop animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Dispose of geometries and materials
    if (this.previewModel) {
      this.previewModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((material) => material.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
    }

    // Clear scene
    if (this.previewScene) {
      this.previewScene.clear();
    }

    // Dispose renderer
    if (this.previewRenderer) {
      this.previewRenderer.dispose();
    }

    // Reset references
    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewModel = null;
    this.previewControls = null;
    this.isAutoRotating = false;
  }
}

// Global reference for button onclick handlers
declare global {
  interface Window {
    demonManagerUI: DemonManagerUI;
  }
}
