import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  latitude: number;
  longitude: number;
  height?: number;
}

export function LocationMap({ latitude, longitude, height = 150 }: Props) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.005},${latitude-0.005},${longitude+0.005},${latitude+0.005}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <View style={[styles.container, { height }]}>
      <iframe
        src={mapUrl}
        style={styles.iframe}
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  iframe: {
    width: '100%',
    height: '100%',
  } as any,
});