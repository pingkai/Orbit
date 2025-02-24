import { Dimensions, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Heading } from "../Global/Heading";
import { Spacer } from "../Global/Spacer";
import { LoadingComponent } from "../Global/Loading";
import React from "react";
import { useTheme } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Clipboard from '@react-native-clipboard/clipboard';

export const ShowLyrics = ({ShowDailog, Loading, Lyric, setShowDailog}) => {
  const height  = Dimensions.get("window").height;
  const width = Dimensions.get("window").width;
  const theme = useTheme();
  return (
    <Modal transparent={true} visible={ShowDailog} statusBarTranslucent={true} >
      <View style={{
        backgroundColor:"rgba(0,0,0,0.75)",
        paddingHorizontal:20,
        paddingVertical:50,
      }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{
          minHeight:height,
        }}>
          {Loading && <LoadingComponent loading={true} height={height - 70}/>}
          {!Loading && <>
            <Heading text={"Lyrics"} style={{
              textAlign:"center",
              fontSize:width * 0.1,
              color:theme.colors.primary,
            }}/>
            <Text selectable={true} style={{
              color:theme.colors.text,
              fontSize:width * 0.055,
              fontWeight:300,
              paddingRight:10,
              textAlign:"center",
            }}>{Lyric?.lyrics?.replaceAll("<br>","\n")}</Text></>}
          <Spacer height={300}/>
        </ScrollView>
        <LinearGradient start={{x: 0, y: 0}} end={{x: 0, y: 1}} colors={['rgba(0,0,0,0.07)','rgba(0,0,0,0.7)','rgb(0,0,0)', 'rgb(7,7,7)' ]} style={{
          flexDirection:"row", 
          gap:10, // Added space between buttons
          position:"absolute", 
          alignItems:"center", 
          justifyContent:"center",
          height:120, 
          paddingTop:70, 
          bottom:20, // Added margin at the bottom
          width:width - 40, // Reduced width to add margin on left and right
          marginHorizontal:20, // Added margin on left and right
          borderRadius:15, // Added border radius for a more modern look
          overflow: "hidden" // Ensures the border radius is applied correctly
        }}>
          <Pressable onPress={()=>{
            setShowDailog(false);
          }} style={{
            flex:1,
            backgroundColor:"rgb(255,255,255)",
            alignItems:"center",
            justifyContent:"center",
            padding:15, // Increased padding for a cleaner look
            borderTopLeftRadius:15,
            borderBottomLeftRadius:15,
          }}>
            <Text style={{
              color:"black",
              fontWeight:"500",
            }}>Close</Text>
          </Pressable>
          <Pressable onPress={()=>Clipboard.setString(Lyric?.lyrics?.replaceAll("<br>","\n") ?? "")} style={{
            flex:1,
            backgroundColor:theme.colors.primary,
            alignItems:"center",
            justifyContent:"center",
            padding:15, // Increased padding for a cleaner look
            borderBottomRightRadius:15,
            borderTopRightRadius:15,
          }}>
            <Text style={{
              color:"black",
              fontWeight:"500",
            }}>Copy</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
};
