namespace MyApi.DTOs;

public record OrderDto(Guid Id, string CustomerName, string? CustomerEmail, decimal Total, DateTime CreatedAt, List<OrderItemDto> Items);
