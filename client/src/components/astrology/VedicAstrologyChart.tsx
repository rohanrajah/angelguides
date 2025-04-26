import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactSVG } from 'react-svg';
import { Skeleton } from '@/components/ui/skeleton';

interface VedicAstrologyChartProps {
  chartData?: any; // Replace with appropriate type
  birthDate?: Date;
  birthTime?: string;
  birthPlace?: string;
}

const VedicAstrologyChart: React.FC<VedicAstrologyChartProps> = ({
  chartData,
  birthDate,
  birthTime,
  birthPlace,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDataReady = !!chartData;

  // Helper function to format the birth date
  const formatBirthDate = (date?: Date) => {
    if (!date) return 'Not provided';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    if (!svgRef.current || !chartData) return;

    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const width = 500;
    const height = 500;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;

    // Group element for the chart
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Draw outer circle
    g.append('circle')
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 2);

    // Draw inner circle
    g.append('circle')
      .attr('r', radius * 0.7)
      .attr('fill', 'none')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1);

    // Draw zodiac divisions (12 segments)
    const pie = d3.pie<number>().value(1);
    const segments = pie(Array(12).fill(1));

    // Draw zodiac segments
    g.selectAll('.segment')
      .data(segments)
      .enter()
      .append('path')
      .attr('class', 'segment')
      .attr('d', d3.arc<any>()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle(d => d.startAngle)
        .endAngle(d => d.endAngle)
      )
      .attr('fill', (d, i) => {
        // Alternate colors for elements
        const colors = ['#f9f9f9', '#f3f3f3'];
        return colors[i % 2];
      })
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1);

    // Add zodiac symbols
    g.selectAll('.zodiac-symbol')
      .data(segments)
      .enter()
      .append('text')
      .attr('class', 'zodiac-symbol')
      .attr('transform', d => {
        const angle = (d.startAngle + d.endAngle) / 2;
        const x = Math.sin(angle) * (radius * 0.85);
        const y = -Math.cos(angle) * (radius * 0.85);
        return `translate(${x},${y})`;
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#555')
      .text((d, i) => {
        const symbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
        return symbols[i % 12];
      });

    // If we have actual planet positions from chartData, we would add them here
    // This is placeholder visualization since we don't have real data yet
    if (chartData.planets) {
      g.selectAll('.planet')
        .data(chartData.planets)
        .enter()
        .append('circle')
        .attr('class', 'planet')
        .attr('cx', d => Math.sin(d.angle) * (radius * d.distance))
        .attr('cy', d => -Math.cos(d.angle) * (radius * d.distance))
        .attr('r', 8)
        .attr('fill', d => d.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      // Add planet symbols
      g.selectAll('.planet-symbol')
        .data(chartData.planets)
        .enter()
        .append('text')
        .attr('class', 'planet-symbol')
        .attr('x', d => Math.sin(d.angle) * (radius * d.distance))
        .attr('y', d => -Math.cos(d.angle) * (radius * d.distance))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#fff')
        .text(d => d.symbol);
    }

  }, [chartData]);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="text-xl mr-2">☉</span> Vedic Astrology Chart
        </CardTitle>
        <CardDescription>
          {birthDate && (
            <div>
              Born on {formatBirthDate(birthDate)}
              {birthTime && <span> at {birthTime}</span>}
              {birthPlace && <span> in {birthPlace}</span>}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {isDataReady ? (
          <>
            <div className="w-full max-w-md">
              <svg ref={svgRef} width="100%" height="500" preserveAspectRatio="xMidYMid meet" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4 w-full max-w-md">
              {/* Placeholder for chart data interpretation */}
              {chartData.elements && chartData.elements.map((element: any, index: number) => (
                <div key={index} className="text-center p-3 bg-muted rounded-md">
                  <div className="text-2xl">{element.symbol}</div>
                  <div className="text-sm font-medium">{element.name}</div>
                  <div className="text-xs text-muted-foreground">{element.position}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center space-y-4">
            <Skeleton className="h-[400px] w-[400px] rounded-full" />
            <div className="w-full flex flex-col space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VedicAstrologyChart;