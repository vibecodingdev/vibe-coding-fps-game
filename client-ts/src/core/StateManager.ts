import { InputState } from "@/types/game";

/**
 * 简化的状态管理器
 * 主要解决inputState引用断开的问题
 */
export class StateManager {
  private static instance: StateManager | null = null;

  // 全局唯一的输入状态对象
  private _inputState: InputState = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isMouseLocked: false,
  };

  private constructor() {}

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /**
   * 获取全局唯一的输入状态对象引用
   * 所有系统都应该使用这个相同的引用
   */
  public getInputState(): InputState {
    return this._inputState;
  }

  /**
   * 重置输入状态，但保持对象引用不变
   */
  public resetInputState(): void {
    this._inputState.moveForward = false;
    this._inputState.moveBackward = false;
    this._inputState.moveLeft = false;
    this._inputState.moveRight = false;
    this._inputState.isMouseLocked = false;
    console.log("🔄 Input state reset (reference preserved)");
  }

  /**
   * 调试方法：显示当前输入状态
   */
  public debugInputState(): void {
    console.log("🔍 Current input state:", this._inputState);
  }
}
