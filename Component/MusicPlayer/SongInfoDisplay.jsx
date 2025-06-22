import React from "react";
import { Heading } from "../Global/Heading";
import { SmallText } from "../Global/SmallText";
import { Spacer } from "../Global/Spacer";

export const SongInfoDisplay = ({ 
  currentPlaying, 
  isOffline, 
  getTextColor,
  style 
}) => {
  const getTitleText = () => {
    if (!currentPlaying?.title) {
      return isOffline ? "Offline Mode" : "No music :(";
    }
    return currentPlaying.title.length > 18 
      ? currentPlaying.title.substring(0, 18) + "..." 
      : currentPlaying.title;
  };

  const getArtistText = () => {
    if (!currentPlaying?.artist) {
      return isOffline ? "Local Music Available" : "Explore now!";
    }
    return currentPlaying.artist.length > 20 
      ? currentPlaying.artist.substring(0, 20) + "..." 
      : currentPlaying.artist;
  };

  return (
    <>
      <Heading
        text={getTitleText()}
        style={{ 
          textAlign: "center", 
          paddingHorizontal: 2, 
          marginBottom: 5, 
          marginTop: 3, 
          fontSize: 30, 
          color: getTextColor('primary'),
          ...style?.title
        }}
        nospace={true}
      />
      <SmallText
        text={getArtistText()}
        style={{ 
          textAlign: "center", 
          fontSize: 15, 
          color: getTextColor('secondary'),
          ...style?.artist
        }}
      />
      <Spacer />
    </>
  );
};
