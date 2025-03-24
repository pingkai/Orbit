/**
 * NativeEventEmitterFix.js
 * 
 * This file provides a fix for the "new NativeEventEmitter()" warning related to missing
 * addListener and removeListeners methods in React Native.
 */
import { NativeEventEmitter, NativeModules } from 'react-native';

// Patch NativeEventEmitter.prototype if needed
const patchNativeEventEmitter = () => {
  if (NativeEventEmitter.prototype) {
    // Save the original constructor
    const originalConstructor = NativeEventEmitter.prototype.constructor;
    
    // Override the constructor
    NativeEventEmitter.prototype.constructor = function(nativeModule) {
      // Call the original constructor
      const emitter = originalConstructor.call(this, nativeModule);
      
      // Add missing methods if they don't exist
      if (nativeModule) {
        // Add missing addListener method
        if (!nativeModule.addListener) {
          nativeModule.addListener = () => {
            return {
              remove: () => {}
            };
          };
        }
        
        // Add missing removeListeners method
        if (!nativeModule.removeListeners) {
          nativeModule.removeListeners = () => {};
        }
      }
      
      return emitter;
    };
  }
};

// Apply the patch
patchNativeEventEmitter();

// Export a function to patch specific emitters that might still cause warnings
export const patchEmitter = (emitter) => {
  if (emitter && !emitter.removeListeners) {
    emitter.removeListeners = () => {};
  }
  
  if (emitter && !emitter.addListener) {
    emitter.addListener = () => {
      return {
        remove: () => {}
      };
    };
  }
  
  return emitter;
}; 