import { Heading } from "../../Component/Global/Heading";
import { MainWrapper } from "../../Layout/MainWrapper";
import { PaddingConatiner } from "../../Layout/PaddingConatiner";
import { Pressable, ScrollView, Switch, ToastAndroid, View, Modal } from "react-native";
import { PlainText } from "../../Component/Global/PlainText";
import { Dropdown } from "react-native-element-dropdown";

import {
  GetDownloadPath,
  GetFontSizeValue,
  GetPlaybackQuality,
  GetThemePreference,
  GetColorScheme,
  SetDownloadPath, 
  SetFontSizeValue,
  SetPlaybackQuality,
  SetThemePreference,
  SetColorScheme,

} from "../../LocalStorage/AppSettings";
import { useEffect, useState } from "react";
import { SmallText } from "../../Component/Global/SmallText";
import { useTheme } from "@react-navigation/native";
import { getColorSchemeOptions, availableColors } from "../../Theme/colorSchemes";

export const SettingsPage = ({navigation}) => {
  const { colors } = useTheme();
  const [Font, setFont] = useState("");
  const [Playback, setPlayback] = useState("");
  const [Download, setDownload] = useState("");
  const [themePreference, setThemePreference] = useState("");
  const [colorScheme, setColorScheme] = useState("");
  

  
  const FontSize = [
    { value: 'Small' },
    { value: 'Medium' },
    { value: 'Large' },
  ];
  
  const PlaybackQuality = [
    { value: '12kbps' },
    { value: '48kbps' },
    { value: '96kbps' },
    { value: '160kbps' },
    { value: '320kbps' },
  ];
  
  const DownloadPath = [
    { value: 'Music' },
    { value: 'Downloads' },
  ];
  
  async function GetFontSize(){
    const data = await GetFontSizeValue();
    setFont(data);
  }
  
  async function GetPlayBack(){
    const data = await GetPlaybackQuality();
    setPlayback(data);
  }
  
  async function GetDownLoad(){
    const data = await GetDownloadPath();
    setDownload(data);
  }
  
  async function GetTheme(){
    const data = await GetThemePreference();
    setThemePreference(data);
  }
  
  async function GetColorSchemePreference(){
    const data = await GetColorScheme();
    setColorScheme(data);
  }
  
  

  async function SetDownLoad({ value }){
    await SetDownloadPath(value);
    ToastAndroid.showWithGravity(
      `Download path changed to ${value}`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
  }
  
  async function SetPlayBack({ value }){
    await SetPlaybackQuality(value);
    ToastAndroid.showWithGravity(
      `Playback quality changed to ${value}`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
  }
  
  async function SetFont({ value }){
    await SetFontSizeValue(value);
    ToastAndroid.showWithGravity(
      `Font size changed to ${value}`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
  }
  
  async function handleThemeToggle() {
    const newTheme = themePreference === 'dark' ? 'light' : 'dark';
    setThemePreference(newTheme);
    await SetThemePreference(newTheme);
    // Theme will be updated on app restart
    ToastAndroid.showWithGravity(
      `Theme changed to ${newTheme} mode. Please restart the app to see changes.`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
  }
  
  async function handleColorSchemeChange({ value }) {
    setColorScheme(value);
    // Save the color scheme preference to AsyncStorage
    await SetColorScheme(value);
    ToastAndroid.showWithGravity(
      `Color scheme changed to ${value}. Please restart the app to see changes.`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
  }
  
  useEffect(() => {
    GetFontSize();
    GetPlayBack();
    GetDownLoad();
    GetTheme();
    GetColorSchemePreference();

  }, []);
  
  return (
    <MainWrapper>
      <PaddingConatiner>
        <Heading text={"SETTINGS"}/>
        <ScrollView>
          <EachSettingsButton text={"Change Name"} OnPress={()=>{
            navigation.navigate("ChangeName");
          }}/>
          <EachSettingsButton text={"Select Languages"} OnPress={()=>{
            navigation.navigate("SelectLanguages");
          }}/>
          <EachDropDownWithLabel data={FontSize} text={"Font size"} placeholder={Font} OnChange={SetFont}/>
          <EachDropDownWithLabel data={PlaybackQuality} text={"Playback quality"} placeholder={Playback} OnChange={SetPlayBack}/>
          <EachDropDownWithLabel data={DownloadPath} text={"Download Path"} placeholder={Download} OnChange={SetDownLoad}/>
          <ThemeToggle themeMode={themePreference} onToggle={handleThemeToggle}/>
          <EachDropDownWithLabel data={getColorSchemeOptions()} text={"Color Scheme"} placeholder={colorScheme} OnChange={handleColorSchemeChange}/>
          
          <SmallText text={"*Note: If you change font size, change name, select languages, theme, or colors, please restart the app to see all changes."}/>
        </ScrollView>
      </PaddingConatiner>
    </MainWrapper>
  );
}

function EachSettingsButton({text, OnPress}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={OnPress} style={{
      backgroundColor: colors.settingsButtonBg,
      padding: 20,
      borderRadius: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    }}>
      <PlainText text={text} style={{ color: colors.text }}/>
      <PlainText text={"→"} style={{ color: colors.text }}/>
    </Pressable>
  );
}

function ThemeToggle({themeMode, onToggle}) {
  const { colors } = useTheme();
  return (
    <Pressable style={{
      backgroundColor: colors.settingsButtonBg,
      padding: 20,
      borderRadius: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    }}>
      <PlainText text={"App Theme"} style={{ color: colors.text }}/>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <PlainText text={themeMode === 'light' ? 'Light' : 'Dark'} style={{ color: colors.text }}/>
        <Switch
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={themeMode === 'light' ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={onToggle}
          value={themeMode === 'light'}
          style={{ marginLeft: 10 }}
        />
      </View>
    </Pressable>
  );
}

function EachDropDownWithLabel({data, text, placeholder, OnChange}){
  const { colors } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.settingsButtonBg,
      padding: 20,
      borderRadius: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    }}>
      <PlainText text={text} style={{ color: colors.text }}/>
      <Dropdown 
        placeholder={placeholder} 
        placeholderStyle={{
          color: colors.text,
        }} 
        itemTextStyle={{
          color: colors.dropdownText,
        }} 
        containerStyle={{
          backgroundColor: colors.dropdownBg,
          borderRadius: 5,
          borderWidth: 0,
        }} 
        style={{
          width: 120,
          backgroundColor: colors.dropdownBg,
          borderRadius: 5,
        }} 
        activeColor={colors.primary + '20'}
        data={data} 
        labelField="value" 
        valueField="value" 
        onChange={OnChange}
      />
    </View>
  );
}
