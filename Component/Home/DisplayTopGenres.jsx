import { memo } from "react";
import { ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { EachMomentsandGenres } from "../Discover/EachMomentsandGenres";

export const DisplayTopGenres = memo(() => {
  const { colors, dark } = useTheme();
  const genres = ["Romance", "Lofi", "Hip Hop", "Classical", "Jazz", "Party", "Retro", "Sad"];
  return (
    <ScrollView showsHorizontalScrollIndicator={false} horizontal={true} contentContainerStyle={{gap:10, paddingHorizontal:10}}>
      {genres.map((e,i)=> <EachMomentsandGenres text={e} key={i} color={colors.primary} style={{
        alignItems:"center",
        justifyContent:"center",
        height:40,
        padding:0,
        paddingLeft:15,
        borderRadius:100000,
        backgroundColor: dark ? colors.cardSurface : colors.searchBar,
      }}/>)}
    </ScrollView>
  );
});
