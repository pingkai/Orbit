import { MainWrapper } from "../../Layout/MainWrapper";
import { EachLibraryCard } from "../../Component/Library/EachLibraryCard";
import { Dimensions, ScrollView, View, BackHandler } from "react-native";
import { RouteHeading } from "../../Component/Home/RouteHeading";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

export const Library = () => {
  const width = Dimensions.get("window").width;
  const navigation = useNavigation();
  
  // Handle back navigation from Library to Home
  useEffect(() => {
    const handleBackPress = () => {
      console.log('Back pressed in Library main page, navigating to Home');
      navigation.navigate('Home');
      return true;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  return (
    <MainWrapper>
      <RouteHeading bottomText={"Your Library"} />
      <ScrollView>
        <View style={{ flexWrap: 'wrap', flexDirection: "row", width: width, justifyContent: "space-evenly" }}>
          <EachLibraryCard text={"Favorites"} icon={"heart"} navigate={"LikedSongs"} />
          <EachLibraryCard text={"Playlists"} icon={"music-box-multiple"} navigate={"CustomPlaylist"} />
          <EachLibraryCard text={"My Music"} icon={"music-note"} navigate={"MyMusicPage"} />
          <EachLibraryCard text={"Fav Playlists"} icon={"playlist-music"} navigate={"LikedPlaylists"} />
          <EachLibraryCard text={"About Developer"} icon={"information"} navigate={"AboutProject"} />
          <View style={{ width: width * 0.45 }} />
        </View>
      </ScrollView>
    </MainWrapper>
  );
};