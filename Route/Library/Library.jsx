import { MainWrapper } from "../../Layout/MainWrapper";
import { EachLibraryCard } from "../../Component/Library/EachLibraryCard";
import { Dimensions, ScrollView, View } from "react-native";
import { RouteHeading } from "../../Component/Home/RouteHeading";


export const Library = () => {
  const width = Dimensions.get("window").width;
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