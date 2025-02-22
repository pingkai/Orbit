import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { MainWrapper } from "../../Layout/MainWrapper";

export const MyMusicPage = () => {
  const [localMusic, setLocalMusic] = useState([]);

  useEffect(() => {
    // Fetch local music files and update state
    // This is a placeholder for actual implementation
    setLocalMusic([
      { id: '1', title: 'Local Song 1' },
      { id: '2', title: 'Local Song 2' },
    ]);
  }, []);

  return (
    <MainWrapper>
      <FlatList
        data={localMusic}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />
    </MainWrapper>
  );
};