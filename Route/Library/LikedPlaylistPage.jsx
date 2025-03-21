import Animated, { useAnimatedRef } from "react-native-reanimated";
import { LikedPagesTopHeader } from "../../Component/Library/TopHeaderLikedPages";
import { LikedDetails } from "../../Component/Library/LikedDetails";
import { useEffect, useState } from "react";
import { GetLikedPlaylist } from "../../LocalStorage/StoreLikedPlaylists";
import { EachPlaylistCard } from "../../Component/Global/EachPlaylistCard";
import { View, BackHandler } from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import { PaddingConatiner } from "../../Layout/PaddingConatiner";


export const LikedPlaylistPage = () => {
  const theme = useTheme()
  const AnimatedRef = useAnimatedRef()
  const [LikedPlaylist, setLikedPlaylist] = useState([]);
  const navigation = useNavigation();
  
  // Add a direct back button handler to ensure proper navigation
  useEffect(() => {
    const handleBackPress = () => {
      console.log('Back pressed in LikedPlaylistPage, navigating to LibraryPage');
      navigation.navigate('LibraryPage');
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  async function getAllLikedSongs(){
    const Playlists = await GetLikedPlaylist()
    const Temp = []
    for (const [key, value] of Object.entries(Playlists.playlist)) {
      Temp[value.count] = value
    }
    setLikedPlaylist(Temp)
   }
  useEffect(() => {
    getAllLikedSongs()
  }, []);
  return (
    <Animated.ScrollView 
      scrollEventThrottle={16} 
      ref={AnimatedRef} 
      contentContainerStyle={{
        paddingBottom: 65,
        backgroundColor: "rgba(0,0,0)",
      }}
    >
      <LikedPagesTopHeader AnimatedRef={AnimatedRef} url={require("../../Images/LikedPlaylist.png")} />
      <LikedDetails name={"Liked Playlists"} dontShowPlayButton={true}/>
      <PaddingConatiner>
        <View style={{backgroundColor: theme.colors.background, flexDirection: 'row', alignItems: "center", justifyContent: "space-between", flexWrap: "wrap"}}>
          {LikedPlaylist.map((e, i) => {
            if (e) {
              return (
                <EachPlaylistCard 
                  key={e.id || `playlist-${i}`} // Added unique key
                  name={e.name}
                  image={e.image}
                  id={e.id}
                  follower={e.follower}
                  MainContainerStyle={{
                    width: "48%",
                  }}
                />
              );
            }
            return null; // Added explicit return for when e is falsy
          })}
          <View/>
        </View>
      </PaddingConatiner>
    </Animated.ScrollView>
  );
};
