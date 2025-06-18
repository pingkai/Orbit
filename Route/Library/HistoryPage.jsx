import React, { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MainWrapper } from '../../Layout/MainWrapper';
import { RouteHeading } from '../../Component/Home/RouteHeading';
import { HistoryScreen } from '../../Component/History/HistoryScreen';

export const HistoryPage = () => {
  const navigation = useNavigation();
  const historyScreenRef = useRef(null);

  // Handle back navigation
  useEffect(() => {
    const handleBackPress = () => {
      console.log('Back pressed in History page, navigating to Library');
      navigation.navigate('LibraryPage');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  // Debug methods (remove in production)
  const handleClearHistory = () => {
    historyScreenRef.current?.clearHistory();
  };

  const handleResetPlayCounts = () => {
    historyScreenRef.current?.resetPlayCounts();
  };

  return (
    <MainWrapper>
      <HistoryScreen ref={historyScreenRef} />
    </MainWrapper>
  );
};
