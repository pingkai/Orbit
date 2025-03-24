// NavigationService.js
import { createRef } from 'react';

export const navigationRef = createRef();

export const NavigationService = {
  navigate: (name, params) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    } else {
      console.error('Navigation reference is not set');
    }
  },
  
  goBack: () => {
    if (navigationRef.current) {
      navigationRef.current.goBack();
    } else {
      console.error('Navigation reference is not set');
    }
  },
  
  reset: (state) => {
    if (navigationRef.current) {
      navigationRef.current.reset(state);
    } else {
      console.error('Navigation reference is not set');
    }
  },
  
  getCurrentRoute: () => {
    if (navigationRef.current) {
      return navigationRef.current.getCurrentRoute();
    } else {
      console.error('Navigation reference is not set');
      return null;
    }
  }
}; 