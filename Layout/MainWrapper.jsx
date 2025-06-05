import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { memo, useEffect, useRef } from "react";
import { StatusBar, LogBox } from "react-native";
import PlaylistSelectorWrapper from "../Component/Playlist/PlaylistSelectorWrapper";
import { PlaylistSelectorRef } from "../Utils/PlaylistSelectorManager";

// Ignore specific harmless warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Possible Unhandled Promise Rejection',
]);

export const MainWrapper = memo(function MainWrapper({children}) {
  const theme = useTheme();
  const playlistSelectorRef = useRef(null);
  
  useEffect(() => {
    console.log('MainWrapper mounted with PlaylistSelectorWrapper');
    // Initialize the global ref
    PlaylistSelectorRef.current = playlistSelectorRef.current;
  }, []);
  
  return (
    <SafeAreaView style={{flex:1,backgroundColor:theme.colors.background}}>
      <StatusBar 
        backgroundColor={theme.colors.background} 
        barStyle={theme.dark ? "light-content" : "dark-content"}
        animated={true}
      />
      {children}
      <PlaylistSelectorWrapper ref={playlistSelectorRef} />
    </SafeAreaView>
  );
});
