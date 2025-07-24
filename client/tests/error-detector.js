// Error Detection and Debugging Script for FPS Game
class GameErrorDetector {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.fixes = [];
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    // Capture and log errors
    captureError(error, context = '') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString()
        };
        this.errors.push(errorInfo);
        console.error(`❌ ERROR [${context}]:`, error);
        return errorInfo;
    }

    // Capture warnings
    captureWarning(message, context = '') {
        const warningInfo = {
            message: message,
            context: context,
            timestamp: new Date().toISOString()
        };
        this.warnings.push(warningInfo);
        console.warn(`⚠️  WARNING [${context}]:`, message);
        return warningInfo;
    }

    // Test function existence and basic functionality
    async testFunctionExists(functionName, context = '') {
        try {
            if (typeof window[functionName] === 'function') {
                console.log(`✅ Function ${functionName} exists`);
                this.testResults.passed++;
                return true;
            } else if (typeof eval(functionName) === 'function') {
                console.log(`✅ Function ${functionName} exists in scope`);
                this.testResults.passed++;
                return true;
            } else {
                throw new Error(`Function ${functionName} is not defined`);
            }
        } catch (error) {
            this.captureError(error, `Function Test: ${functionName} - ${context}`);
            this.testResults.failed++;
            return false;
        } finally {
            this.testResults.total++;
        }
    }

    // Test variable existence
    async testVariableExists(variableName, context = '') {
        try {
            if (typeof window[variableName] !== 'undefined') {
                console.log(`✅ Variable ${variableName} exists`);
                this.testResults.passed++;
                return true;
            } else if (typeof eval(variableName) !== 'undefined') {
                console.log(`✅ Variable ${variableName} exists in scope`);
                this.testResults.passed++;
                return true;
            } else {
                throw new Error(`Variable ${variableName} is not defined`);
            }
        } catch (error) {
            this.captureError(error, `Variable Test: ${variableName} - ${context}`);
            this.testResults.failed++;
            return false;
        } finally {
            this.testResults.total++;
        }
    }

    // Test DOM element existence
    async testDOMElement(elementId, context = '') {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                console.log(`✅ DOM element ${elementId} exists`);
                this.testResults.passed++;
                return true;
            } else {
                throw new Error(`DOM element ${elementId} not found`);
            }
        } catch (error) {
            this.captureError(error, `DOM Test: ${elementId} - ${context}`);
            this.testResults.failed++;
            return false;
        } finally {
            this.testResults.total++;
        }
    }

    // Test Three.js objects
    async testThreeJSObjects() {
        const threeObjects = ['scene', 'camera', 'renderer'];
        
        for (const objName of threeObjects) {
            await this.testVariableExists(objName, 'Three.js Setup');
        }

        // Test if Three.js is loaded
        try {
            if (typeof THREE === 'undefined') {
                throw new Error('THREE.js library is not loaded');
            }
            console.log('✅ THREE.js library loaded');
            this.testResults.passed++;
        } catch (error) {
            this.captureError(error, 'Three.js Library');
            this.testResults.failed++;
        } finally {
            this.testResults.total++;
        }
    }

    // Test game state variables
    async testGameState() {
        const gameVars = [
            'gameState', 'gameInitialized', 'isMultiplayer',
            'demons', 'bullets', 'currentWeapon', 'playerHealth'
        ];

        for (const varName of gameVars) {
            await this.testVariableExists(varName, 'Game State');
        }
    }

    // Test core game functions
    async testCoreFunctions() {
        const coreFunctions = [
            'init', 'animate', 'startGame', 'pauseGame', 'resumeGame',
            'createGun', 'createMachineGun', 'shoot', 'updateBullets',
            'spawnDemons', 'updateDemons', 'initControls'
        ];

        for (const funcName of coreFunctions) {
            await this.testFunctionExists(funcName, 'Core Functions');
        }
    }

    // Test UI functions
    async testUIFunctions() {
        const uiFunctions = [
            'updateHealthBar', 'updateWeaponDisplay', 'updateKillCount',
            'showMainMenu', 'hideAllMenus', 'initializeUI'
        ];

        for (const funcName of uiFunctions) {
            await this.testFunctionExists(funcName, 'UI Functions');
        }
    }

    // Test DOM elements
    async testDOMElements() {
        const requiredElements = [
            'mainMenu', 'gameUI', 'healthBar', 'weaponInfo',
            'crosshair', 'radarCanvas', 'gameOver'
        ];

        for (const elementId of requiredElements) {
            await this.testDOMElement(elementId, 'Required UI Elements');
        }
    }

    // Test audio system
    async testAudioSystem() {
        const audioFunctions = [
            'initAudio', 'playGunfireSound', 'playDemonGrowlSound',
            'playDemonAttackSound', 'updateSoundVolumes'
        ];

        for (const funcName of audioFunctions) {
            await this.testFunctionExists(funcName, 'Audio System');
        }

        // Test audio variables
        await this.testVariableExists('audioListener', 'Audio System');
        await this.testVariableExists('sounds', 'Audio System');
    }

    // Test multiplayer functions
    async testMultiplayerSystem() {
        const multiplayerFunctions = [
            'initializeNetworking', 'createRoom', 'joinRoom', 'leaveRoom',
            'sendChatMessage', 'updateConnectionStatus'
        ];

        for (const funcName of multiplayerFunctions) {
            await this.testFunctionExists(funcName, 'Multiplayer System');
        }
    }

    // Check for common JavaScript errors
    async checkCommonErrors() {
        console.log('🔍 Checking for common JavaScript errors...');

        // Check for undefined variables that should be defined
        const criticalVars = ['THREE', 'scene', 'camera', 'renderer'];
        for (const varName of criticalVars) {
            try {
                if (typeof window[varName] === 'undefined' && typeof eval(varName) === 'undefined') {
                    this.captureWarning(`Critical variable ${varName} is undefined`, 'Critical Variables');
                }
            } catch (e) {
                this.captureError(e, `Checking variable ${varName}`);
            }
        }

        // Check for null references that might cause errors
        try {
            if (typeof gun !== 'undefined' && gun === null) {
                this.captureWarning('Gun object is null - may cause rendering issues', 'Weapon System');
            }
            if (typeof controls !== 'undefined' && controls === null) {
                this.captureWarning('Controls object is null - may cause input issues', 'Control System');
            }
        } catch (e) {
            this.captureError(e, 'Null Reference Check');
        }
    }

    // Generate fixes for common issues
    generateFixes() {
        console.log('🔧 Generating fixes for detected issues...');

        this.errors.forEach(error => {
            let fix = null;

            if (error.message.includes('is not defined')) {
                const varName = error.message.match(/(\w+) is not defined/)?.[1];
                if (varName) {
                    fix = {
                        issue: error.message,
                        solution: `Add variable declaration: let ${varName};`,
                        code: `let ${varName};`,
                        priority: 'HIGH'
                    };
                }
            } else if (error.message.includes('not found')) {
                const elementId = error.message.match(/element (\w+) not found/)?.[1];
                if (elementId) {
                    fix = {
                        issue: error.message,
                        solution: `Add DOM element with id="${elementId}" to HTML`,
                        code: `<div id="${elementId}"></div>`,
                        priority: 'MEDIUM'
                    };
                }
            } else if (error.message.includes('Function') && error.message.includes('is not defined')) {
                const funcName = error.message.match(/Function (\w+) is not defined/)?.[1];
                if (funcName) {
                    fix = {
                        issue: error.message,
                        solution: `Add function declaration: function ${funcName}() {}`,
                        code: `function ${funcName}() {\n  // TODO: Implement ${funcName}\n  console.log('${funcName} called');\n}`,
                        priority: 'HIGH'
                    };
                }
            }

            if (fix) {
                this.fixes.push(fix);
            }
        });

        return this.fixes;
    }

    // Run comprehensive error detection
    async runFullErrorDetection() {
        console.log('🚀 Starting comprehensive error detection...');
        
        // Set up error capturing
        window.addEventListener('error', (event) => {
            this.captureError(event.error, 'Global Error Handler');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.captureError(new Error(event.reason), 'Unhandled Promise Rejection');
        });

        try {
            // Run all tests
            await this.testThreeJSObjects();
            await this.testGameState();
            await this.testCoreFunctions();
            await this.testUIFunctions();
            await this.testDOMElements();
            await this.testAudioSystem();
            await this.testMultiplayerSystem();
            await this.checkCommonErrors();

            // Generate fixes
            this.generateFixes();

            // Print summary
            this.printSummary();

        } catch (error) {
            this.captureError(error, 'Error Detection Process');
        }

        return {
            errors: this.errors,
            warnings: this.warnings,
            fixes: this.fixes,
            testResults: this.testResults
        };
    }

    // Print summary of results
    printSummary() {
        console.log('\n📊 ERROR DETECTION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Tests Passed: ${this.testResults.passed}`);
        console.log(`❌ Tests Failed: ${this.testResults.failed}`);
        console.log(`📊 Total Tests: ${this.testResults.total}`);
        console.log(`📈 Success Rate: ${Math.round((this.testResults.passed / this.testResults.total) * 100)}%`);
        console.log(`🐛 Errors Found: ${this.errors.length}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        console.log(`🔧 Fixes Generated: ${this.fixes.length}`);

        if (this.errors.length > 0) {
            console.log('\n❌ CRITICAL ERRORS:');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. [${error.context}] ${error.message}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. [${warning.context}] ${warning.message}`);
            });
        }

        if (this.fixes.length > 0) {
            console.log('\n🔧 SUGGESTED FIXES:');
            this.fixes.forEach((fix, index) => {
                console.log(`${index + 1}. [${fix.priority}] ${fix.solution}`);
                console.log(`   Code: ${fix.code}`);
            });
        }
    }

    // Apply automatic fixes where possible
    async applyFixes() {
        console.log('🔧 Applying automatic fixes...');
        
        let appliedFixes = 0;
        
        this.fixes.forEach(fix => {
            try {
                if (fix.priority === 'HIGH' && fix.code.startsWith('let ')) {
                    // Apply variable declarations
                    eval(fix.code);
                    console.log(`✅ Applied fix: ${fix.solution}`);
                    appliedFixes++;
                } else if (fix.priority === 'HIGH' && fix.code.startsWith('function ')) {
                    // Apply function declarations
                    eval(fix.code);
                    console.log(`✅ Applied fix: ${fix.solution}`);
                    appliedFixes++;
                }
            } catch (error) {
                console.error(`❌ Failed to apply fix: ${fix.solution}`, error);
            }
        });

        console.log(`🎉 Applied ${appliedFixes} automatic fixes`);
        return appliedFixes;
    }
}

// Create global instance
window.gameErrorDetector = new GameErrorDetector();

// Auto-run detection when script loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Game Error Detector loaded');
    
    // Wait a bit for the game to initialize
    setTimeout(async () => {
        const results = await window.gameErrorDetector.runFullErrorDetection();
        
        // Try to apply fixes
        await window.gameErrorDetector.applyFixes();
        
        // Re-run detection after fixes
        console.log('\n🔄 Re-running detection after fixes...');
        await window.gameErrorDetector.runFullErrorDetection();
        
    }, 2000);
});

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameErrorDetector;
} 