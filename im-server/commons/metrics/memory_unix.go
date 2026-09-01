//go:build !windows

package metrics

import (
	"fmt"

	"github.com/mackerelio/go-osstat/memory"
)

func GetMemoryMetrics() (MemoryMetrics, error) {
	stats, err := memory.Get()
	if err != nil {
		return MemoryMetrics{}, fmt.Errorf("collect memory metrics: %w", err)
	}

	return MemoryMetrics{
		TotalBytes:       stats.Total,
		UsedBytes:        stats.Used,
		FreeBytes:        stats.Free,
		AvailableBytes:   memoryAvailableBytes(stats, stats.Free),
		UsagePercent:     usagePercent(stats.Used, stats.Total),
		SwapTotalBytes:   stats.SwapTotal,
		SwapUsedBytes:    stats.SwapUsed,
		SwapFreeBytes:    stats.SwapFree,
		SwapUsagePercent: usagePercent(stats.SwapUsed, stats.SwapTotal),
	}, nil
}
