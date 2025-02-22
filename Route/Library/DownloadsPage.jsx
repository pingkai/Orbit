import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { MainWrapper } from "../../Layout/MainWrapper";
import { GetDownloadPath } from "../../LocalStorage/AppSettings";

export const DownloadsPage = () => {
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    // Fetch downloaded files from the specified path
    // This is a placeholder for actual implementation
    const fetchDownloads = async () => {
      const path = await GetDownloadPath();
      // Logic to list files from the download path
      setDownloads([
        { id: '1', title: 'Downloaded Song 1' },
        { id: '2', title: 'Downloaded Song 2' },
      ]);
    };
    fetchDownloads();
  }, []);

  return (
    <MainWrapper>
      <FlatList
        data={downloads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />
    </MainWrapper>
  );
};