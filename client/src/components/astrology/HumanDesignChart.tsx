import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface HumanDesignChartProps {
  designData?: any; // Replace with appropriate type
  birthDate?: Date;
  birthTime?: string;
  birthPlace?: string;
}

const HumanDesignChart: React.FC<HumanDesignChartProps> = ({
  designData,
  birthDate,
  birthTime,
  birthPlace,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDataReady = !!designData;

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
    if (!svgRef.current || !designData) return;

    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const width = 500;
    const height = 650;

    // Group element for the chart
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Draw centers (9 energy centers in Human Design)
    const centers = [
      { name: 'Head', x: 0, y: -220, radius: 25, color: '#a8d0e6' },
      { name: 'Ajna', x: 0, y: -150, radius: 25, color: '#f8e9a1' },
      { name: 'Throat', x: 0, y: -80, radius: 25, color: '#f76c6c' },
      { name: 'G', x: -60, y: -20, radius: 30, color: '#a8d0e6' },
      { name: 'Heart', x: 60, y: -20, radius: 25, color: '#f76c6c' },
      { name: 'Solar Plexus', x: -60, y: 60, radius: 30, color: '#f8e9a1' },
      { name: 'Sacral', x: 0, y: 100, radius: 30, color: '#f76c6c' },
      { name: 'Spleen', x: 70, y: 60, radius: 25, color: '#a8d0e6' },
      { name: 'Root', x: 0, y: 180, radius: 25, color: '#f8e9a1' },
    ];

    // Draw the centers
    g.selectAll('.center')
      .data(centers)
      .enter()
      .append('circle')
      .attr('class', 'center')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('opacity', d => {
        // If we have real data, we would use it to determine which centers are defined
        if (designData.definedCenters && designData.definedCenters.includes(d.name)) {
          return 1;
        }
        return 0.3; // Undefined centers are more transparent
      });

    // Add center names
    g.selectAll('.center-name')
      .data(centers)
      .enter()
      .append('text')
      .attr('class', 'center-name')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .text(d => d.name);

    // Draw channels (connections between centers)
    // This is simplified - in a real implementation, you would use actual channel data
    const channels = [
      { source: 'Head', target: 'Ajna', defined: designData.definedChannels?.includes('Head-Ajna') },
      { source: 'Ajna', target: 'Throat', defined: designData.definedChannels?.includes('Ajna-Throat') },
      { source: 'Throat', target: 'G', defined: designData.definedChannels?.includes('Throat-G') },
      { source: 'Throat', target: 'Heart', defined: designData.definedChannels?.includes('Throat-Heart') },
      { source: 'G', target: 'Heart', defined: designData.definedChannels?.includes('G-Heart') },
      { source: 'G', target: 'Solar Plexus', defined: designData.definedChannels?.includes('G-Solar Plexus') },
      { source: 'Solar Plexus', target: 'Sacral', defined: designData.definedChannels?.includes('Solar Plexus-Sacral') },
      { source: 'Sacral', target: 'Root', defined: designData.definedChannels?.includes('Sacral-Root') },
      { source: 'Spleen', target: 'Sacral', defined: designData.definedChannels?.includes('Spleen-Sacral') },
      { source: 'Solar Plexus', target: 'Root', defined: designData.definedChannels?.includes('Solar Plexus-Root') },
    ];

    // Convert center names to coordinates
    const getCoordinates = (name: string) => {
      const center = centers.find(c => c.name === name);
      return center ? { x: center.x, y: center.y } : { x: 0, y: 0 };
    };

    // Draw the channels
    g.selectAll('.channel')
      .data(channels)
      .enter()
      .append('line')
      .attr('class', 'channel')
      .attr('x1', d => getCoordinates(d.source).x)
      .attr('y1', d => getCoordinates(d.source).y)
      .attr('x2', d => getCoordinates(d.target).x)
      .attr('y2', d => getCoordinates(d.target).y)
      .attr('stroke', '#666')
      .attr('stroke-width', 2)
      .attr('opacity', d => d.defined ? 1 : 0.2);

    // Add gates (specific points on channels)
    // In a real implementation, you would use actual gate data
    if (designData.gates) {
      g.selectAll('.gate')
        .data(designData.gates)
        .enter()
        .append('circle')
        .attr('class', 'gate')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 5)
        .attr('fill', '#ff9e3d')
        .attr('stroke', '#333')
        .attr('stroke-width', 1);
    }

  }, [designData]);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="text-xl mr-2">⚛️</span> Human Design Chart
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
              <svg ref={svgRef} width="100%" height="650" preserveAspectRatio="xMidYMid meet" />
            </div>
            <div className="w-full max-w-md space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Type</h3>
                <Badge variant="outline" className="text-md px-3 py-1">
                  {designData.type || 'Not Available'}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  {designData.strategy || 'Not Available'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Authority</h3>
                <p className="text-sm text-muted-foreground">
                  {designData.authority || 'Not Available'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Profile</h3>
                <Badge variant="outline" className="text-md px-3 py-1">
                  {designData.profile || 'Not Available'}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Definition</h3>
                <p className="text-sm text-muted-foreground">
                  {designData.definition || 'Not Available'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center space-y-4">
            <Skeleton className="h-[500px] w-[400px]" />
            <div className="w-full flex flex-col space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HumanDesignChart;