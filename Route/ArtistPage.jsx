import React from 'react';
import { View } from 'react-native';
import { MainWrapper } from '../Layout/MainWrapper';
import { PlainText } from '../Component/Global/PlainText';
import { useRoute } from '@react-navigation/native';

const ArtistPage = () => {
  const route = useRoute();
  const { artistId, artistName } = route.params;

  return (
    <MainWrapper>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <PlainText text={`Artist: ${artistName}`} />
        <PlainText text={`ID: ${artistId}`} />
      </View>
    </MainWrapper>
  );
};

export default ArtistPage;
